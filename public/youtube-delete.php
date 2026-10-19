<?php
/**
 * SmartGarden.gr - One-off/utility: delete an uploaded YouTube video.
 *
 * Uses the same stored OAuth refresh token as youtube-publish.php and
 * youtube-set-status.php. videos.delete needs the broad "youtube" or
 * "youtube.force-ssl" scope; the stored token only carries youtube.upload +
 * the two readonly scopes (see youtube-auth-login.php), so this is expected
 * to fail with 403 insufficient_scope until the app is re-authorised with a
 * wider grant. Written to confirm that empirically rather than guess.
 *
 * POST JSON: { videoId: "..." }
 *
 * Needs the cron key (X-Cron-Key header or ?key=): when the token is widened this file really deletes videos,
 * so it must not answer anyone who finds the URL. Nothing in the pipeline calls it; use it only when the owner asks.
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

if (!$videoId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing videoId']);
    exit;
}

$delCh = curl_init('https://www.googleapis.com/youtube/v3/videos?id=' . rawurlencode($videoId));
curl_setopt_array($delCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
]);
$delResp = curl_exec($delCh);
$delStatus = curl_getinfo($delCh, CURLINFO_HTTP_CODE);
curl_close($delCh);

// A successful delete returns 204 No Content, so a non-empty body on success is unusual;
// treat 200-299 as success regardless of body.
if ($delStatus < 200 || $delStatus >= 300) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'YouTube delete failed', 'httpCode' => $delStatus, 'details' => $delResp]);
    exit;
}

echo json_encode(['success' => true, 'videoId' => $videoId]);
