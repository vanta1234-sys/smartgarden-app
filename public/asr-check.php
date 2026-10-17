<?php
/**
 * SmartGarden.gr — transcribe a short piece of Greek narration with Gemini, so a render can be checked against its script.
 *
 * Why it exists: Whisper is not installed on the owner's machine and installing it means a 300 MB download, while the long-video
 * narration is cut out of chunks by a pause-matching algorithm that nobody had verified word for word. A transcript of every scene
 * shows whether each cut fell on the right sentence.
 *
 * POST JSON {"audioBase64": "...", "mime": "audio/mpeg"}  (key in X-Cron-Key or ?key=)
 * -> {"success": true, "text": "...", "model": "..."}
 *
 * Uses the same API keys as tts-edge.php (environment, then gemini_keys.txt above the document root). Never logs or returns a key.
 */
header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$given = isset($_SERVER['HTTP_X_CRON_KEY']) ? $_SERVER['HTTP_X_CRON_KEY'] : (isset($_GET['key']) ? $_GET['key'] : '');
if (!in_array($given, $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'error' => 'Unauthorized'));
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(array('success' => true, 'info' => 'POST {audioBase64, mime} to transcribe Greek audio (max about 3 MB).'));
    exit;
}

$in = json_decode((string) file_get_contents('php://input'), true);
$b64 = is_array($in) && isset($in['audioBase64']) ? (string) $in['audioBase64'] : '';
$mime = is_array($in) && isset($in['mime']) ? (string) $in['mime'] : 'audio/mpeg';
if ($b64 === '' || strlen($b64) > 4500000 || !preg_match('#^audio/[a-z0-9.+-]+$#i', $mime)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'audioBase64 missing or too large, or mime not audio/*'));
    exit;
}

function asr_keys() {
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

$prompt = 'Transcribe exactly what is spoken in this Greek audio, word for word, in Greek letters. '
        . 'Do not correct, summarise, translate or add anything; if a word is cut off or unclear write it as heard. '
        . 'Write numbers as digits. Output only the transcript.';
$payload = json_encode(array(
    'contents' => array(array('parts' => array(
        array('text' => $prompt),
        array('inline_data' => array('mime_type' => $mime, 'data' => $b64)),
    ))),
    'generationConfig' => array('temperature' => 0),
));

$lastStatus = 0;
$trace = array();
@set_time_limit(115);
// 3.1-flash-lite answers reliably (a 503 "overloaded" now and then, hence the retries); on 2026-10-18 the other two made the origin answer 502.
$models = array('gemini-3.1-flash-lite', 'gemini-3.5-flash');
if (is_array($in) && isset($in['model']) && in_array($in['model'], $models, true)) $models = array($in['model']);
foreach ($models as $model) {
    $keys = asr_keys();
    for ($attempt = 0; $attempt < 8 && count($keys); $attempt++) {
        $apiKey = $keys[$attempt % count($keys)];
        if ($attempt > 0) usleep(1200000);
        $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent');
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'x-goog-api-key: ' . $apiKey),
        ));
        $t0 = microtime(true);
        $body = curl_exec($ch);
        $lastStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $trace[] = $model . ':' . $lastStatus . ':' . round((microtime(true) - $t0) * 1000) . 'ms';
        $j = json_decode((string) $body, true);
        if ($lastStatus === 200 && isset($j['candidates'][0]['content']['parts'])) {
            $text = '';
            foreach ($j['candidates'][0]['content']['parts'] as $p) if (isset($p['text'])) $text .= $p['text'];
            echo json_encode(array('success' => true, 'text' => trim($text), 'model' => $model, 'trace' => $trace), JSON_UNESCAPED_UNICODE);
            exit;
        }
        if ($lastStatus !== 429 && $lastStatus !== 403 && $lastStatus !== 503 && $lastStatus !== 500) break; // a real error: no point in retrying
    }
}
// 200 on purpose: Cloudflare replaces the body of an origin 502 with its own page, which hides the trace.
echo json_encode(array('success' => false, 'error' => 'no model answered', 'upstreamStatus' => $lastStatus, 'trace' => $trace));
