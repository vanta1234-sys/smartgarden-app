<?php
/**
 * SmartGarden.gr - Free, high-quality Greek TTS via Microsoft Edge's "Read Aloud"
 * neural voice service (same engine as edge-tts / Microsoft Edge browser), reverse-engineered
 * WebSocket protocol, no API key, no cost. Implemented from scratch in PHP (no WebSocket
 * client extension available on this shared host) using a raw TLS socket + hand-rolled
 * RFC 6455 framing, since this is an unofficial endpoint with no simple HTTP form.
 *
 * GET /tts-edge.php?text=...&voice=el-GR-AthinaNeural  -> raw audio/mpeg bytes.
 * On any failure, returns HTTP 502 JSON so the caller can fall back to tts-greek.php
 * (Google Translate TTS) instead.
 */

$text = isset($_GET['text']) ? trim($_GET['text']) : '';
$voice = isset($_GET['voice']) ? trim($_GET['voice']) : 'el-GR-AthinaNeural';
$rate = isset($_GET['rate']) ? trim($_GET['rate']) : '+0%';

if ($text === '') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => 'Missing text parameter'));
    exit;
}

function edgeTtsFail($message) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => $message));
    exit;
}

// ==========================================
// 1. Sec-MS-GEC token (5-minute-window SHA256 of Windows-epoch ticks + trusted token)
// ==========================================
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = 11644473600;

function generateSecMsGec() {
    $ticks = microtime(true) + WIN_EPOCH;
    $ticks -= fmod($ticks, 300);
    $ticks = $ticks * (1000000000 / 100);
    $strToHash = sprintf('%.0f', $ticks) . TRUSTED_CLIENT_TOKEN;
    return strtoupper(hash('sha256', $strToHash));
}

function randomHexUpper($bytes) {
    return strtoupper(bin2hex(random_bytes($bytes)));
}

// ==========================================
// 2. Minimal RFC6455 WebSocket client over a raw TLS socket
// ==========================================
function wsConnect($host, $port, $path, $headers, $timeoutSeconds) {
    $context = stream_context_create(array('ssl' => array('verify_peer' => true, 'verify_peer_name' => true)));
    $sock = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        $timeoutSeconds,
        STREAM_CLIENT_CONNECT,
        $context
    );
    if (!$sock) {
        throw new Exception("TCP/TLS connect failed: {$errstr} ({$errno})");
    }
    stream_set_timeout($sock, $timeoutSeconds);

    $wsKey = base64_encode(random_bytes(16));
    $reqHeaders = array(
        "GET {$path} HTTP/1.1",
        "Host: {$host}",
        "Upgrade: websocket",
        "Connection: Upgrade",
        "Sec-WebSocket-Key: {$wsKey}",
        "Sec-WebSocket-Version: 13",
    );
    foreach ($headers as $k => $v) {
        $reqHeaders[] = "{$k}: {$v}";
    }
    $request = implode("\r\n", $reqHeaders) . "\r\n\r\n";
    fwrite($sock, $request);

    // Read HTTP upgrade response headers (until blank line).
    $responseHeaders = '';
    while (!feof($sock)) {
        $line = fgets($sock, 4096);
        if ($line === false) break;
        $responseHeaders .= $line;
        if (rtrim($line) === '') break;
    }
    if (strpos($responseHeaders, '101') === false) {
        throw new Exception('WebSocket handshake failed: ' . substr($responseHeaders, 0, 200));
    }

    return $sock;
}

function wsSendText($sock, $payload) {
    $data = $payload;
    $len = strlen($data);
    $mask = random_bytes(4);
    $frame = chr(0x81); // FIN + text opcode

    if ($len <= 125) {
        $frame .= chr(0x80 | $len);
    } elseif ($len <= 65535) {
        $frame .= chr(0x80 | 126) . pack('n', $len);
    } else {
        $frame .= chr(0x80 | 127) . pack('J', $len);
    }
    $frame .= $mask;
    $masked = '';
    for ($i = 0; $i < $len; $i++) {
        $masked .= chr(ord($data[$i]) ^ ord($mask[$i % 4]));
    }
    $frame .= $masked;
    fwrite($sock, $frame);
}

function readExact($sock, $n) {
    $buf = '';
    while (strlen($buf) < $n) {
        $chunk = fread($sock, $n - strlen($buf));
        if ($chunk === false || $chunk === '') {
            if (feof($sock)) throw new Exception('Connection closed while reading frame');
            continue;
        }
        $buf .= $chunk;
    }
    return $buf;
}

// Returns array('opcode' => int, 'payload' => string) or null on close frame.
function wsReadFrame($sock) {
    $first2 = readExact($sock, 2);
    $b0 = ord($first2[0]);
    $b1 = ord($first2[1]);
    $opcode = $b0 & 0x0F;
    $masked = ($b1 & 0x80) !== 0;
    $len = $b1 & 0x7F;

    if ($len === 126) {
        $ext = readExact($sock, 2);
        $len = unpack('n', $ext)[1];
    } elseif ($len === 127) {
        $ext = readExact($sock, 8);
        $unpacked = unpack('J', $ext);
        $len = $unpacked[1];
    }

    $maskKey = '';
    if ($masked) {
        $maskKey = readExact($sock, 4);
    }

    $payload = $len > 0 ? readExact($sock, $len) : '';
    if ($masked) {
        $unmasked = '';
        for ($i = 0; $i < strlen($payload); $i++) {
            $unmasked .= chr(ord($payload[$i]) ^ ord($maskKey[$i % 4]));
        }
        $payload = $unmasked;
    }

    if ($opcode === 0x8) { // close
        return null;
    }
    return array('opcode' => $opcode, 'payload' => $payload);
}

// ==========================================
// 3. Run the synthesis
// ==========================================
try {
    $connectionId = randomHexUpper(16); // 32 hex chars, like a UUID without dashes (uppercase is fine)
    $gec = generateSecMsGec();
    $muid = randomHexUpper(16);
    $chromiumMajor = '143';

    $path = '/consumer/speech/synthesize/readaloud/edge/v1'
        . '?TrustedClientToken=' . TRUSTED_CLIENT_TOKEN
        . '&ConnectionId=' . $connectionId
        . '&Sec-MS-GEC=' . $gec
        . '&Sec-MS-GEC-Version=1-143.0.3650.75';

    $userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{$chromiumMajor}.0.0.0 Safari/537.36 Edg/{$chromiumMajor}.0.0.0";

    $headers = array(
        'Pragma' => 'no-cache',
        'Cache-Control' => 'no-cache',
        'Origin' => 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent' => $userAgent,
        'Accept-Encoding' => 'gzip, deflate, br',
        'Accept-Language' => 'en-US,en;q=0.9',
        'Cookie' => "muid={$muid};",
    );

    $sock = wsConnect('speech.platform.bing.com', 443, $path, $headers, 8);

    $ts = gmdate('D M d Y H:i:s') . ' GMT+0000 (Coordinated Universal Time)';
    $configMsg = "X-Timestamp:{$ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
        . json_encode(array(
            'context' => array(
                'synthesis' => array(
                    'audio' => array(
                        'metadataoptions' => array('sentenceBoundaryEnabled' => 'false', 'wordBoundaryEnabled' => 'false'),
                        'outputFormat' => 'audio-24khz-48kbitrate-mono-mp3',
                    ),
                ),
            ),
        ));
    wsSendText($sock, $configMsg);

    $requestId = randomHexUpper(16);
    $safeText = htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $safeVoice = htmlspecialchars($voice, ENT_QUOTES, 'UTF-8');
    $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='el-GR'>"
        . "<voice name='{$safeVoice}'><prosody pitch='+0Hz' rate='{$rate}' volume='+0%'>{$safeText}</prosody></voice></speak>";
    $ssmlMsg = "X-RequestId:{$requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:{$ts}Z\r\nPath:ssml\r\n\r\n{$ssml}";
    wsSendText($sock, $ssmlMsg);

    $audio = '';
    $turnEnded = false;
    $deadline = microtime(true) + 12;

    while (!$turnEnded && microtime(true) < $deadline) {
        $frame = wsReadFrame($sock);
        if ($frame === null) break; // connection closed
        if ($frame['opcode'] === 0x2) { // binary = audio chunk
            $payload = $frame['payload'];
            if (strlen($payload) >= 2) {
                $headerLen = unpack('n', substr($payload, 0, 2))[1];
                $audio .= substr($payload, 2 + $headerLen);
            }
        } elseif ($frame['opcode'] === 0x1) { // text = status message
            if (strpos($frame['payload'], 'Path:turn.end') !== false) {
                $turnEnded = true;
            }
        }
    }

    fclose($sock);

    if (empty($audio)) {
        edgeTtsFail('No audio received from Edge TTS');
    }

    header('Content-Type: audio/mpeg');
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . strlen($audio));
    echo $audio;
} catch (Exception $e) {
    edgeTtsFail($e->getMessage());
}
