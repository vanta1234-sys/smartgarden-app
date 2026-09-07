<?php
// AI plant health diagnosis from a user-uploaded photo, using Gemini's multimodal
// (vision) API. Reuses the same GEMINI_API_KEY already configured for article
// generation (see cron-publish.php) — no new credentials needed.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed'));
    exit;
}

$geminiKey = getenv('GEMINI_API_KEY');
if (!$geminiKey) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'error' => 'Server misconfiguration: no API key'));
    exit;
}

// Lightweight per-IP rate limit (file-based, no DB needed on this shared host) —
// protects the Gemini API quota/cost from being burned by scripted abuse of a
// publicly-reachable endpoint. Max 8 diagnoses/hour/IP.
$usageFile = __DIR__ . '/plant_diagnosis_usage.json';
$clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
$now = time();
$usage = array();
if (file_exists($usageFile)) {
    $decoded = json_decode(@file_get_contents($usageFile), true);
    if (is_array($decoded)) {
        $usage = $decoded;
    }
}
$recent = isset($usage[$clientIp]) ? array_filter($usage[$clientIp], function ($t) use ($now) {
    return $t > $now - 3600;
}) : array();
if (count($recent) >= 8) {
    http_response_code(429);
    echo json_encode(array('success' => false, 'error' => 'Πολλά αιτήματα διάγνωσης. Δοκιμάστε ξανά σε λίγο.'));
    exit;
}
$recent[] = $now;
$usage[$clientIp] = array_values($recent);
// Keep the file small: drop IPs with no activity in the last hour.
foreach ($usage as $ip => $timestamps) {
    $filtered = array_values(array_filter($timestamps, function ($t) use ($now) { return $t > $now - 3600; }));
    if (empty($filtered)) {
        unset($usage[$ip]);
    } else {
        $usage[$ip] = $filtered;
    }
}
@file_put_contents($usageFile, json_encode($usage));

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$imageDataUri = isset($body['image']) ? $body['image'] : '';
$userNote = isset($body['note']) ? trim(substr($body['note'], 0, 300)) : '';

if (!$imageDataUri || strpos($imageDataUri, 'base64,') === false) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Missing or invalid image data'));
    exit;
}

// Extract mime type + raw base64 payload from a "data:image/jpeg;base64,...." string.
if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $imageDataUri, $m)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Unrecognized image data format'));
    exit;
}
$mimeType = $m[1];
$base64Data = $m[2];

// ~4MB base64 cap (roughly 3MB actual image) — plenty for a phone photo, protects
// PHP memory and keeps the Gemini request fast.
if (strlen($base64Data) > 5.5 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(array('success' => false, 'error' => 'Image too large (max ~4MB)'));
    exit;
}

$prompt = "Είσαι έμπειρος γεωπόνος-φυτοπαθολόγος που εξετάζει φωτογραφία φυτού από Έλληνα ερασιτέχνη κηπουρό (μπαλκόνι/γλάστρα). "
    . "Ανάλυσε την εικόνα και εντόπισε το κύριο πρόβλημα (έντομο/παράσιτο, ασθένεια, έλλειψη θρεπτικού στοιχείου, πρόβλημα ποτίσματος, ή φυσιολογική κατάσταση χωρίς πρόβλημα). "
    . ($userNote !== '' ? ("Ο χρήστης σημειώνει: \"" . $userNote . "\". ") : '')
    . "Απάντησε ΑΠΟΚΛΕΙΣΤΙΚΑ με ένα έγκυρο JSON αντικείμενο (χωρίς markdown code fences, χωρίς επιπλέον κείμενο) με ακριβώς αυτά τα πεδία: "
    . '{"problem": "σύντομος τίτλος προβλήματος στα ελληνικά", "confidence": "high|medium|low", "cause": "σύντομη επιστημονική εξήγηση της αιτίας (2-3 προτάσεις)", "treatment": "συγκεκριμένη, εφαρμόσιμη θεραπεία με δοσολογίες όπου ταιριάζει (3-5 προτάσεις)", "isHealthy": true ή false}';

$genConfig = array('temperature' => 0.4, 'maxOutputTokens' => 1024);
$payload = json_encode(array(
    'contents' => array(array('parts' => array(
        array('text' => $prompt),
        array('inline_data' => array('mime_type' => $mimeType, 'data' => $base64Data)),
    ))),
    'generationConfig' => $genConfig,
));

function callGeminiVision($model, $geminiKey, $payload, $timeoutSeconds) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . $geminiKey;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeoutSeconds);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array($result, $httpCode);
}

function extractDiagnosisJson($raw, $httpCode) {
    if ($httpCode !== 200 || !$raw) {
        return null;
    }
    $data = json_decode($raw, true);
    $text = isset($data['candidates'][0]['content']['parts'][0]['text']) ? $data['candidates'][0]['content']['parts'][0]['text'] : '';
    if (!$text) {
        return null;
    }
    // Strip accidental markdown code fences if the model adds them anyway.
    $text = trim(preg_replace('/^```(json)?|```$/m', '', trim($text)));
    $parsed = json_decode($text, true);
    if (!is_array($parsed) || !isset($parsed['problem'])) {
        return null;
    }
    return $parsed;
}

set_time_limit(35);
// gemini-3.1-flash-lite is the model already verified reliable/fast on this host
// (see cron-publish.php); gemini-3.5-flash is the fallback if it fails or the
// response can't be parsed as the expected JSON shape.
$models = array('gemini-3.1-flash-lite', 'gemini-3.5-flash');
$diagnosis = null;
$lastHttpCode = 0;
foreach ($models as $model) {
    list($raw, $httpCode) = callGeminiVision($model, $geminiKey, $payload, 25);
    $lastHttpCode = $httpCode;
    $diagnosis = extractDiagnosisJson($raw, $httpCode);
    if ($diagnosis) {
        break;
    }
}

if (!$diagnosis) {
    http_response_code(502);
    echo json_encode(array('success' => false, 'error' => 'AI diagnosis unavailable right now, try again', 'httpCode' => $lastHttpCode));
    exit;
}

echo json_encode(array(
    'success' => true,
    'problem' => $diagnosis['problem'],
    'confidence' => isset($diagnosis['confidence']) ? $diagnosis['confidence'] : 'medium',
    'cause' => isset($diagnosis['cause']) ? $diagnosis['cause'] : '',
    'treatment' => isset($diagnosis['treatment']) ? $diagnosis['treatment'] : '',
    'isHealthy' => isset($diagnosis['isHealthy']) ? (bool)$diagnosis['isHealthy'] : false,
), JSON_UNESCAPED_UNICODE);
