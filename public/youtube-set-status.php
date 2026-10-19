<?php
/**
 * SmartGarden.gr - One-off/utility: change privacyStatus of an already-uploaded
 * YouTube video (e.g. to pull down a broken render fast without waiting on a
 * code fix + republish). Uses the same stored OAuth refresh token as youtube-publish.php.
 * POST JSON: { videoId: "...", privacyStatus: "private" | "unlisted" | "public" }
 *
 * Needs the cron key (X-Cron-Key header or ?key=), like every other endpoint that acts on the channel: once the
 * token carries the youtube.force-ssl scope this file can really change a video's visibility, so it must not be open.
 * The current status is read first and sent back whole with only privacyStatus changed, because videos.update on the
 * status part replaces it and would otherwise reset embeddable / license / made-for-kids to their defaults.
 */
header('Content-Type: application/json; charset=utf-8');
set_time_limit(60);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$given = isset($_SERVER['HTTP_X_CRON_KEY']) ? $_SERVER['HTTP_X_CRON_KEY'] : (isset($_GET['key']) ? $_GET['key'] : '');
if (!in_array($given, $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

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

// Read the status the video has now (readonly scope is enough) so the PUT below changes nothing but the visibility.
$curCh = curl_init('https://www.googleapis.com/youtube/v3/videos?part=status&id=' . rawurlencode($videoId));
curl_setopt_array($curCh, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken]]);
$curResp = json_decode((string) curl_exec($curCh), true);
curl_close($curCh);
if (empty($curResp['items'][0]['status'])) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Video not found on this channel (or its status could not be read)', 'videoId' => $videoId]);
    exit;
}
$keep = array();
foreach (array('embeddable', 'license', 'publicStatsViewable', 'selfDeclaredMadeForKids') as $field) {
    if (isset($curResp['items'][0]['status'][$field])) $keep[$field] = $curResp['items'][0]['status'][$field];
}
$keep['privacyStatus'] = $privacyStatus;

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
        'status' => $keep,
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

$updated = json_decode($updateResp, true);
echo json_encode([
    'success' => true,
    'videoId' => $videoId,
    'privacyStatusRequested' => $privacyStatus,
    'privacyStatusActual' => isset($updated['status']['privacyStatus']) ? $updated['status']['privacyStatus'] : null,
]);
