<?php
/**
 * SmartGarden.gr - Checks the processing status of a previously uploaded TikTok video.
 * URL: https://smartgarden.gr/tiktok-check-status.php?publish_id=XXX&sandbox=1
 */

header('Content-Type: application/json; charset=utf-8');

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';
$publishId = $_GET['publish_id'] ?? '';
$tokensPath = __DIR__ . '/' . ($isSandbox ? 'tiktok_tokens_sandbox.json' : 'tiktok_tokens.json');

if (!$publishId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing publish_id']);
    exit;
}

if (!file_exists($tokensPath)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not connected']);
    exit;
}

$tokens = json_decode(file_get_contents($tokensPath), true);
$accessToken = $tokens['access_token'] ?? null;

$ch = curl_init('https://open.tiktokapis.com/v2/post/publish/status/fetch/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json; charset=UTF-8',
    ],
    CURLOPT_POSTFIELDS => json_encode(['publish_id' => $publishId]),
]);
$response = curl_exec($ch);
$curlErr = curl_error($ch);
curl_close($ch);

echo $response ?: json_encode(['success' => false, 'error' => $curlErr]);
