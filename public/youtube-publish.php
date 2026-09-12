<?php
/**
 * SmartGarden.gr - Upload a video to YouTube (as a Short) using the stored OAuth
 * refresh token from youtube-auth-callback.php.
 * POST JSON: { videoBase64: "data:video/mp4;base64,...", title, description }
 */
header('Content-Type: application/json; charset=utf-8');
set_time_limit(120);

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
    echo json_encode(['success' => false, 'error' => 'YouTube not connected yet. Visit /youtube-auth-login.php first.']);
    exit;
}

$tokens = json_decode(file_get_contents($tokensPath), true);
if (empty($tokens['refresh_token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No refresh token stored. Re-run /youtube-auth-login.php.']);
    exit;
}

// Always refresh — simpler and safer than trusting a possibly-stale cached
// access_token/expires_at across requests on a shared host.
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
$videoDataUri = $body['videoBase64'] ?? '';
$title = trim($body['title'] ?? 'SmartGarden.gr Guide');
$description = trim($body['description'] ?? '');

if (!$videoDataUri || strpos($videoDataUri, 'base64,') === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing or invalid videoBase64']);
    exit;
}

// Videos coming straight from TikTokStudio.tsx's MediaRecorder output are raw
// video/webm, not mp4 — detect the real mime type from the data URI instead of
// assuming mp4, so the multipart Content-Type below actually matches the bytes.
$videoMimeType = 'video/mp4';
if (preg_match('/^data:(video\/[a-zA-Z0-9.+-]+);base64,/', $videoDataUri, $mimeMatch)) {
    $videoMimeType = $mimeMatch[1];
}

list(, $base64Data) = explode('base64,', $videoDataUri, 2);
$videoBinary = base64_decode($base64Data);
if ($videoBinary === false || strlen($videoBinary) < 1000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Decoded video data looks invalid/too small']);
    exit;
}

// #Shorts in the title/description is what routes a vertical <=60s upload into
// the Shorts shelf instead of regular long-form video.
if (stripos($title . $description, '#shorts') === false) {
    $description = trim($description . "\n\n#Shorts #Κηπουρική #SmartGarden");
}

$metadata = json_encode([
    'snippet' => [
        'title' => mb_substr($title, 0, 100),
        'description' => mb_substr($description, 0, 5000),
        'tags' => ['κηπουρική', 'μπαλκόνι', 'gardening', 'smartgarden'],
        'categoryId' => '26', // Howto & Style
    ],
    'status' => [
        // Uploads default to private until a human reviews and promotes them (2026-09-12,
        // after a broken 9-minute render with dead air went public and was seen before
        // anyone caught it — see tiktok_integration memory). Flip to 'public' in YouTube
        // Studio once you've actually watched it. The stored OAuth token only has upload
        // scope (no videos.update/delete), so this can't be changed back to public from
        // here either — that's also a manual Studio step, same as this was.
        'privacyStatus' => 'private',
        'selfDeclaredMadeForKids' => false,
    ],
], JSON_UNESCAPED_UNICODE);

$boundary = 'smartgarden-' . bin2hex(random_bytes(8));
$multipartBody = "--{$boundary}\r\n"
    . "Content-Type: application/json; charset=UTF-8\r\n\r\n"
    . $metadata . "\r\n"
    . "--{$boundary}\r\n"
    . "Content-Type: {$videoMimeType}\r\n\r\n"
    . $videoBinary . "\r\n"
    . "--{$boundary}--";

$uploadCh = curl_init('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status');
curl_setopt_array($uploadCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: multipart/related; boundary=' . $boundary,
        'Content-Length: ' . strlen($multipartBody),
    ],
    CURLOPT_POSTFIELDS => $multipartBody,
    CURLOPT_TIMEOUT => 100,
]);
$uploadResponse = curl_exec($uploadCh);
$httpCode = curl_getinfo($uploadCh, CURLINFO_HTTP_CODE);
curl_close($uploadCh);

$result = json_decode($uploadResponse, true);

if ($httpCode >= 200 && $httpCode < 300 && !empty($result['id'])) {
    echo json_encode([
        'success' => true,
        'videoId' => $result['id'],
        'url' => 'https://youtube.com/shorts/' . $result['id'],
    ]);
} else {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'YouTube upload failed', 'httpCode' => $httpCode, 'detail' => $uploadResponse]);
}
