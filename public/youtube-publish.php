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
    // 200-with-success:false on purpose, not a 5xx: Cloudflare replaces any origin 5xx
    // body with its own error page, so the real Google error was hidden behind a bare
    // "error code: 502" and an ordinary expired refresh token looked like a gateway
    // fault. The caller already treats success:false as a failure.
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => 'Failed to refresh YouTube access token', 'detail' => $refreshResponse]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$title = trim($body['title'] ?? 'SmartGarden.gr Guide');
$description = trim($body['description'] ?? '');

$videoBinary = null;
$videoMimeType = 'video/mp4';

// Two ways in. The browser posts the recording inline as base64; the server-side
// renderer just names the render job it produced, because base64-ing a 15MB mp4 into a
// JSON body would sail past this host's post_max_size. Only a job id is accepted, never
// a path — it is basename()d and resolved under the jobs root, so it can't address
// anything but a rendered video.
$jobId = isset($body['job']) ? basename((string) $body['job']) : '';
if ($jobId !== '') {
    $cronKeys = ['smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026'];
    if (!in_array($body['key'] ?? '', $cronKeys, true)) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'Unauthorized job upload']);
        exit;
    }
    $jobsRoot = is_dir(dirname(__DIR__) . '/video-jobs') ? dirname(__DIR__) . '/video-jobs' : __DIR__ . '/video-jobs';
    $videoPath = $jobsRoot . '/' . $jobId . '/video.mp4';
    if (!is_file($videoPath)) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'No rendered video for job ' . $jobId]);
        exit;
    }
    $videoBinary = file_get_contents($videoPath);
} else {
    $videoDataUri = $body['videoBase64'] ?? '';
    if (!$videoDataUri || strpos($videoDataUri, 'base64,') === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing or invalid videoBase64']);
        exit;
    }
    // Videos coming straight from TikTokStudio.tsx's MediaRecorder output are raw
    // video/webm, not mp4 — detect the real mime type from the data URI instead of
    // assuming mp4, so the multipart Content-Type below actually matches the bytes.
    if (preg_match('/^data:(video\/[a-zA-Z0-9.+-]+);base64,/', $videoDataUri, $mimeMatch)) {
        $videoMimeType = $mimeMatch[1];
    }
    list(, $base64Data) = explode('base64,', $videoDataUri, 2);
    $videoBinary = base64_decode($base64Data);
}

if ($videoBinary === false || strlen((string) $videoBinary) < 1000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Decoded video data looks invalid/too small']);
    exit;
}

// #Shorts in the title/description is what routes a vertical <=60s upload into
// the Shorts shelf instead of regular long-form video.
if (stripos($title . $description, '#shorts') === false) {
    $description = trim($description . "\n\n#Shorts #Κηπουρική #SmartGarden");
}

$privacyStatus = isset($body['privacyStatus']) && in_array($body['privacyStatus'], array('private', 'unlisted', 'public'), true)
    ? $body['privacyStatus']
    : 'private';

$metadata = json_encode([
    'snippet' => [
        'title' => mb_substr($title, 0, 100),
        'description' => mb_substr($description, 0, 5000),
        'tags' => ['κηπουρική', 'μπαλκόνι', 'gardening', 'smartgarden'],
        'categoryId' => '26', // Howto & Style
    ],
    'status' => [
        // Private unless the caller says otherwise. The default exists because on
        // 2026-09-12 a broken 9-minute render with dead air went public and was seen before
        // anyone caught it; the worker now only asks for 'public' when the render passes
        // the checks that would have caught that one. The stored OAuth token has upload
        // scope only, so a video already up can be changed only in Studio.
        'privacyStatus' => $privacyStatus,
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
    // Same reason as above — a 5xx here gets swallowed by Cloudflare and the actual
    // YouTube API error never reaches the caller.
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => 'YouTube upload failed', 'httpCode' => $httpCode, 'detail' => $uploadResponse]);
}
