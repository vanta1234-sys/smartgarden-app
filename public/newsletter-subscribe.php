<?php
// Newsletter signup — creates/updates a contact in Brevo via their REST API.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed'));
    exit;
}

$brevoKey = getenv('BREVO_API_KEY');
if (!$brevoKey) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'error' => 'Server misconfiguration'));
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$email = isset($body['email']) ? trim($body['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Μη έγκυρη διεύθυνση email'));
    exit;
}

// Lightweight per-IP rate limit — same pattern as plant-diagnosis.php — to stop a
// scripted flood of fake signups from burning through the Brevo free-tier quota.
$usageFile = __DIR__ . '/newsletter_signup_usage.json';
$clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
$now = time();
$usage = array();
if (file_exists($usageFile)) {
    $decoded = json_decode(@file_get_contents($usageFile), true);
    if (is_array($decoded)) $usage = $decoded;
}
$recent = isset($usage[$clientIp]) ? array_filter($usage[$clientIp], function ($t) use ($now) { return $t > $now - 3600; }) : array();
if (count($recent) >= 5) {
    http_response_code(429);
    echo json_encode(array('success' => false, 'error' => 'Πολλές προσπάθειες εγγραφής. Δοκιμάστε ξανά σε λίγο.'));
    exit;
}
$recent[] = $now;
$usage[$clientIp] = array_values($recent);
foreach ($usage as $ip => $timestamps) {
    $filtered = array_values(array_filter($timestamps, function ($t) use ($now) { return $t > $now - 3600; }));
    if (empty($filtered)) unset($usage[$ip]); else $usage[$ip] = $filtered;
}
@file_put_contents($usageFile, json_encode($usage));

$payload = json_encode(array(
    'email' => $email,
    'updateEnabled' => true,
    'attributes' => array('SOURCE' => 'smartgarden.gr'),
));

$ch = curl_init('https://api.brevo.com/v3/contacts');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Accept: application/json',
    'api-key: ' . $brevoKey,
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Brevo returns 201 for a new contact, 204 for an update (contact already existed) —
// both mean success from the visitor's point of view.
if ($httpCode === 201 || $httpCode === 204) {
    echo json_encode(array('success' => true));
    exit;
}

$decoded = json_decode($result, true);
$brevoCode = isset($decoded['code']) ? $decoded['code'] : '';
if ($brevoCode === 'duplicate_parameter') {
    echo json_encode(array('success' => true));
    exit;
}

http_response_code(502);
echo json_encode(array('success' => false, 'error' => 'Η εγγραφή απέτυχε προσωρινά. Δοκιμάστε ξανά.', 'httpCode' => $httpCode));
