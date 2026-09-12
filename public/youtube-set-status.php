<?php
/**
 * SmartGarden.gr - One-off/utility: change privacyStatus of an already-uploaded
 * YouTube video (e.g. to pull down a broken render fast without waiting on a
 * code fix + republish). Uses the same stored OAuth refresh token as youtube-publish.php.
 * POST JSON: { videoId: "...", privacyStatus: "private" | "unlisted" | "public" }
 */
header('Content-Type: application/json; charset=utf-8');
set_time_limit(60);

$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$clientSecret = getenv('YOUTUBE_CLIENT_SECRET') ?: '';
$tokensPath = __DIR__ . '/youtube_tokens.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!$clientId || !$clientSecret || !file_exists($tokensPath)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'YouTube not connected yet.']);
    exit;
}

$tokens = json_decode(file_get_contents($tokensPath), true);
if (empty($tokens['refresh_token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No refresh token stored.']);
    exit;
}

$refreshCh = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($refreshCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'refresh_token' => $tokens['refresh_token'],
        'grant_type' => 'refresh_token',
    ]),
]);
$refreshResponse = curl_exec($refreshCh);
curl_close($refreshCh);
$refreshData = json_decode($refreshResponse, true);
$accessToken = $refreshData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Failed to refresh YouTube access token', 'detail' => $refreshResponse]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$videoId = $body['videoId'] ?? '';
$privacyStatus = $body['privacyStatus'] ?? 'private';

if (!$videoId || !in_array($privacyStatus, ['private', 'unlisted', 'public'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing videoId or invalid privacyStatus']);
    exit;
}

$updateCh = curl_init('https://www.googleapis.com/youtube/v3/videos?part=status');
curl_setopt_array($updateCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json; charset=UTF-8',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'id' => $videoId,
        'status' => ['privacyStatus' => $privacyStatus],
    ]),
]);
$updateResp = curl_exec($updateCh);
$updateStatus = curl_getinfo($updateCh, CURLINFO_HTTP_CODE);
curl_close($updateCh);

if ($updateStatus < 200 || $updateStatus >= 300) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'YouTube update failed', 'details' => $updateResp]);
    exit;
}

echo json_encode(['success' => true, 'result' => json_decode($updateResp, true)]);
