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

// POST for long narration: a 1,500-character Greek chunk is ~9 KB once URL-encoded, and the web server answers 414 beyond ~8 KB.
$text = isset($_POST['text']) ? trim($_POST['text']) : (isset($_GET['text']) ? trim($_GET['text']) : '');
$voice = isset($_GET['voice']) ? trim($_GET['voice']) : 'el-GR-AthinaNeural';
$rate = isset($_GET['rate']) ? trim($_GET['rate']) : '+0%';
// ?meta=1 returns JSON with per-word timings alongside the audio, for caption tracks.
$wantMeta = isset($_GET['meta']);

if ($text === '') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => 'Missing text parameter'));
    exit;
}

// The Gemini path spends a free daily allowance (10 requests per model and key) that the video pipeline needs, so it is for the
// pipeline's own calls only: they prove themselves with the secret in internal_secret.txt, which lives above the web root and
// never in the repository (the cron key is public there). Anyone else who asks for Gemini is refused instead of burning the day's quota.
$internalSecretFile = dirname(__DIR__) . '/internal_secret.txt';
$internalSecret = is_file($internalSecretFile) ? trim((string) @file_get_contents($internalSecretFile)) : '';
$internalOk = $internalSecret !== '' && isset($_SERVER['HTTP_X_INTERNAL']) && hash_equals($internalSecret, (string) $_SERVER['HTTP_X_INTERNAL']);
if (mb_strlen($text, 'UTF-8') > 4000) {
    http_response_code(413);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => 'text too long'));
    exit;
}

// PHP's own default max_execution_time (commonly 30s on shared hosting) was shorter than
// the receive-loop deadline below, so a long synthesis got killed by PHP itself before
// that deadline -- or this script's own error handling -- ever ran, surfacing as a bare
// Cloudflare 502 with no body instead of a graceful JSON error or a complete result
// (found 2026-09-29, raising the deadline from 12s to handle longer scenes exposed this).
set_time_limit(50);

// ==========================================
// 0. Gemini speech (Google's official TTS), tried first unless ?engine=edge
// ==========================================
// Microsoft changed the Edge "read aloud" handshake on 2026-10-13 (403 -> a Cloudflare 502 here), and the Azure
// route needs a card, so the narration now comes from Gemini TTS with the key the site already holds for its
// articles (GEMINI_API_KEY). ?engine=gemini = Gemini only, ?engine=edge = the Edge path below only. The video
// worker (video-worker.php) passes the engine and the model explicitly and keeps ONE of each for a whole video,
// so a render never changes voice halfway. Plain (no ?meta=1) requests without ?engine= keep the Edge path:
// the browser callers (TikTokStudio.tsx, greekSpeechSynthesizer.ts) read the answer as 48 kbps mp3 and would
// mis-measure a WAV.
//
// Measured 2026-10-16 on this key (free tier, no billing): the answer is 24 kHz mono 16-bit audio (WAV here), about
// 15 characters of Greek per second, and every TTS model has its OWN allowance of 10 requests a day
// (quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier), gemini-3.8-flash-tts also 3 a minute. That is
// why there are four models below and why the worker picks one per video. A 429 comes back with
// quota = "day" (this model is finished for today) or "minute" (wait retryAfter seconds).
// The REST API has no word timings: ?meta=1 returns an empty "words" list, as the worker already copes with.
const GEMINI_TTS_MODELS = array('gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts');
const GEMINI_TTS_VOICE = 'Kore';

function geminiTtsFail($info, $message) {
    $code = isset($info['status']) ? (int) $info['status'] : 0;
    http_response_code($code === 429 ? 429 : 502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array(
        'error' => $message, 'engine' => 'gemini', 'upstreamStatus' => $code,
        'quota' => isset($info['quota']) ? $info['quota'] : '', 'retryAfter' => isset($info['retryAfter']) ? (int) $info['retryAfter'] : 0,
        'detail' => isset($info['detail']) ? $info['detail'] : '',
    ));
    exit;
}

// Every Google project has its own free allowance (10 requests a day per model), so extra keys made in NEW projects
// multiply it: GEMINI_API_KEY (the site's own), GEMINI_API_KEY_2.., and one key per line in /gemini_keys.txt above
// the web root. A key whose allowance for this model is gone for the day hands over to the next one; the model, and
// so the voice, stays the same.
function geminiKeys() {
    $keys = array();
    foreach (array('GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5') as $name) {
        $v = trim((string) getenv($name));
        if ($v !== '') $keys[] = $v;
    }
    $file = dirname(__DIR__) . '/gemini_keys.txt';
    if (is_file($file)) {
        foreach ((array) file($file, FILE_IGNORE_NEW_LINES) as $line) {
            $line = trim($line);
            if ($line !== '' && $line[0] !== '#') $keys[] = $line;
        }
    }
    return array_values(array_unique($keys));
}

// Returns WAV bytes, or null with $info = array(status, quota, retryAfter) describing what went wrong.
function geminiTtsSynthesize($text, $voiceName, $model, $timeout, &$info) {
    $info = array('status' => 0, 'quota' => '', 'retryAfter' => 0);
    $keys = geminiKeys();
    if (!count($keys)) return null;
    $dayOutEverywhere = true;
    $minuteInfo = null;
    foreach ($keys as $key) {
        $wav = geminiTtsSynthesizeWithKey($key, $text, $voiceName, $model, $timeout, $info);
        if ($wav !== null) return $wav;
        if ($info['status'] === 429) {
            // Every key (project) has its own per-day AND per-minute allowance: a 429 on one hands over to the next key, whichever
            // limit it was. Only when all of them are limited is the answer a 429 (and a per-minute one if any key still has its day).
            if ($info['quota'] !== 'day') {
                $dayOutEverywhere = false;
                if ($minuteInfo === null || $info['retryAfter'] < $minuteInfo['retryAfter']) $minuteInfo = $info;
            }
            continue;
        }
        $dayOutEverywhere = false;
        $minuteInfo = null;
        break;
    }
    if ($dayOutEverywhere) { $info['status'] = 429; $info['quota'] = 'day'; }
    elseif ($minuteInfo !== null) $info = $minuteInfo;
    return null;
}

function geminiTtsSynthesizeWithKey($key, $text, $voiceName, $model, $timeout, &$info) {
    $info = array('status' => 0, 'quota' => '', 'retryAfter' => 0);
    $interactions = strpos($model, 'gemini-3.8') === 0;
    if ($interactions) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
        $payload = array(
            'model' => $model,
            'input' => array(array('type' => 'user_input', 'content' => array(array('type' => 'text', 'text' => $text)))),
            'response_format' => array('type' => 'audio'),
            'generation_config' => array('speech_config' => array(array('voice' => $voiceName))),
        );
    } else {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent';
        $payload = array(
            'contents' => array(array('parts' => array(array('text' => $text)))),
            'generationConfig' => array(
                'responseModalities' => array('AUDIO'),
                'speechConfig' => array('voiceConfig' => array('prebuiltVoiceConfig' => array('voiceName' => $voiceName))),
            ),
        );
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'x-goog-api-key: ' . $key),
    ));
    $raw = curl_exec($ch);
    $info['status'] = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($raw)) { $info['status'] = 0; return null; }
    if ($info['status'] === 429) {
        if (preg_match('/retry in (?:(\d+)h)?(?:(\d+)m)?(\d+)(?:\.\d+)?s/i', $raw, $m)) {
            $info['retryAfter'] = (int) $m[1] * 3600 + (int) $m[2] * 60 + (int) $m[3];
        } elseif (preg_match('/"retryDelay":\s*"(\d+)s"/', $raw, $m)) {
            $info['retryAfter'] = (int) $m[1];
        }
        // "limit: 10 requests per day" (3.8 models) or quotaId ...PerDay... (older ones), or a wait of a quarter of an hour or more
        $info['quota'] = (stripos($raw, 'per day') !== false || stripos($raw, 'PerDay') !== false || $info['retryAfter'] >= 900) ? 'day' : 'minute';
        return null;
    }
    if ($info['status'] !== 200) {
        // what the API said (never the key: anything that looks like one is blanked), so a 400 is not a mystery
        $info['detail'] = mb_substr(preg_replace('/AIza[0-9A-Za-z_-]{20,}/', '[key]', preg_replace('/\s+/', ' ', $raw)), 0, 260);
        return null;
    }
    $j = json_decode($raw, true);
    $audio = false;
    if ($interactions) {
        foreach ((array) ($j['steps'] ?? array()) as $step) {
            foreach ((array) ($step['content'] ?? array()) as $part) {
                if (($part['type'] ?? '') === 'audio' && !empty($part['data'])) $audio = base64_decode($part['data'], true);
            }
        }
        // Already a WAV with its header.
        if ($audio === false || strlen($audio) < 4800 || substr($audio, 0, 4) !== 'RIFF') { $info['status'] = 0; return null; }
        $seconds = (strlen($audio) - 44) / 48000;
        $wav = $audio;
    } else {
        $b64 = isset($j['candidates'][0]['content']['parts'][0]['inlineData']['data']) ? $j['candidates'][0]['content']['parts'][0]['inlineData']['data'] : '';
        $pcm = $b64 !== '' ? base64_decode($b64, true) : false;
        if ($pcm === false || strlen($pcm) < 4800) { $info['status'] = 0; return null; }
        $seconds = strlen($pcm) / 48000;
        $wav = 'RIFF' . pack('V', 36 + strlen($pcm)) . 'WAVEfmt ' . pack('VvvVVvv', 16, 1, 1, 24000, 48000, 2, 16)
             . 'data' . pack('V', strlen($pcm)) . $pcm;
    }
    // Greek comes out at about 15 characters a second. Far from that means the model dropped or garbled
    // the line (it does, now and then): refuse it so the caller asks again, rather than ship a clipped scene.
    $rate = mb_strlen($text, 'UTF-8') / max(0.1, $seconds);
    if ($rate < 8 || $rate > 24) { $info['status'] = 0; return null; }
    return $wav;
}

$engineParam = isset($_GET['engine']) ? strtolower(trim($_GET['engine'])) : 'auto';
if ($engineParam === 'gemini' && !$internalOk) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => 'Forbidden', 'engine' => 'gemini'));
    exit;
}
if ($engineParam !== 'edge' && ($engineParam === 'gemini' || $wantMeta) && $internalOk && count(geminiKeys()) > 0) {
    $gVoice = isset($_GET['gvoice']) && preg_match('/^[A-Za-z]{3,20}$/', $_GET['gvoice']) ? $_GET['gvoice'] : GEMINI_TTS_VOICE;
    $gModel = isset($_GET['gmodel']) && in_array($_GET['gmodel'], GEMINI_TTS_MODELS, true) ? $_GET['gmodel'] : GEMINI_TTS_MODELS[0];
    $gInfo = array();
    // A chunk of several scenes (long videos, ~1,300 characters) takes 30-45 s to generate; Cloudflare gives up on a request at 100 s.
    if ($engineParam === 'gemini') set_time_limit(100);
    $gWav = geminiTtsSynthesize($text, $gVoice, $gModel, $engineParam === 'gemini' ? 90 : 25, $gInfo);
    if ($gWav !== null) {
        header('X-TTS-Engine: gemini');
        if ($wantMeta) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(array('success' => true, 'words' => array(), 'audioBase64' => base64_encode($gWav), 'engine' => 'gemini', 'model' => $gModel));
            exit;
        }
        header('Content-Type: audio/wav');
        header('Content-Length: ' . strlen($gWav));
        echo $gWav;
        exit;
    }
    if ($engineParam === 'gemini') geminiTtsFail($gInfo, ($gInfo['status'] ?? 0) === 429 ? 'Gemini TTS rate limit (' . $gModel . ')' : 'Gemini TTS returned nothing usable (' . $gModel . ')');
    // auto: fall through to the Edge path below
}
if ($engineParam === 'gemini') geminiTtsFail(array('status' => 0), 'GEMINI_API_KEY is not configured');

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

    // Also sets the socket's ongoing read timeout (via stream_set_timeout inside
    // wsConnect), not just the initial handshake -- 8s there meant a single slow gap
    // between chunks during a long synthesis could truncate the stream even with the
    // outer receive-loop deadline raised below. 20s tolerates a slow chunk without
    // masking a genuinely dead connection for too long.
    $sock = wsConnect('speech.platform.bing.com', 443, $path, $headers, 20);

    $ts = gmdate('D M d Y H:i:s') . ' GMT+0000 (Coordinated Universal Time)';
    $configMsg = "X-Timestamp:{$ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
        . json_encode(array(
            'context' => array(
                'synthesis' => array(
                    'audio' => array(
                        'metadataoptions' => array('sentenceBoundaryEnabled' => 'false', 'wordBoundaryEnabled' => $wantMeta ? 'true' : 'false'),
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
    $words = array();
    $turnEnded = false;
    // 12s cut synthesis off mid-stream for anything long enough to need it: found
    // 2026-09-29 when a ~26-32s scene came back with audio that just stopped mid-sentence
    // ("κόβεται ξαφνικά", reported against the water-quality video) -- the loop hit this
    // deadline before Path:turn.end arrived, so $audio held only whatever chunks had
    // streamed back so far, and that partial clip still passed the caller's ">4000 bytes"
    // sanity check and got accepted as a complete scene. Both callers already budget 45-60s
    // for the whole HTTP round trip (video-worker.php's sg_fetch_to_file, video-render.php's
    // selftest probe), so raising this to 35s leaves real margin under either without
    // risking an indefinite hang.
    $deadline = microtime(true) + 35;

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
            } elseif ($wantMeta && strpos($frame['payload'], 'Path:audio.metadata') !== false) {
                // Edge reports when each word is spoken, in 100-nanosecond ticks from the
                // start of the audio. That is what makes word-by-word captions possible
                // without guessing at timings from character counts.
                $split = explode("

", $frame['payload'], 2);
                $meta = isset($split[1]) ? json_decode($split[1], true) : null;
                if (isset($meta['Metadata']) && is_array($meta['Metadata'])) {
                    foreach ($meta['Metadata'] as $entry) {
                        if (($entry['Type'] ?? '') !== 'WordBoundary') continue;
                        $d = $entry['Data'] ?? array();
                        $words[] = array(
                            'text' => $d['text']['Text'] ?? '',
                            'start' => round(($d['Offset'] ?? 0) / 10000000, 3),
                            'end' => round((($d['Offset'] ?? 0) + ($d['Duration'] ?? 0)) / 10000000, 3),
                        );
                    }
                }
            }
        }
    }

    fclose($sock);

    if (empty($audio)) {
        edgeTtsFail('No audio received from Edge TTS');
    }

    if ($wantMeta) {
        // Audio and timings have to travel together: the caller needs both to build a
        // caption track, and a second synthesis pass would return different timings.
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array(
            'success' => true,
            'words' => $words,
            'audioBase64' => base64_encode($audio),
            'engine' => 'edge',
        ));
        exit;
    }

    header('X-TTS-Engine: edge');
    header('Content-Type: audio/mpeg');
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . strlen($audio));
    echo $audio;
} catch (Exception $e) {
    edgeTtsFail($e->getMessage());
}
