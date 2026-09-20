<?php
/**
 * SmartGarden.gr - Upload a video to YouTube (as a Short) using the stored OAuth
 * refresh token from youtube-auth-callback.php.
 * POST JSON: { videoBase64: "data:video/mp4;base64,...", title, description }
 */
header('Content-Type: application/json; charset=utf-8');
// A Short is 8-15MB and uploads in seconds. A twelve-minute episode is 100-200MB and needs
// both the time and, further down, a transfer that never holds the file in memory.
set_time_limit(900);

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
// Set instead of $videoBinary when the source is a rendered job on disk and large enough
// that reading it into a string would be reckless. Streamed straight off disk further down.
$videoPath = null;

// Two ways in. The browser posts the recording inline as base64; the server-side
// renderer just names the render job it produced, because base64-ing a 15MB mp4 into a
// JSON body would sail past this host's post_max_size. Only a job id is accepted, never
// a path — it is basename()d and resolved under the jobs root, so it can't address
// anything but a rendered video.
/**
 * Set the thumbnail on a video we have just uploaded.
 *
 * thumbnails.set accepts the youtube.upload scope, which is the one this token holds —
 * unlike videos.update, which needs a wider scope and answers 403 here. So the picture can
 * be set automatically even though the privacy of an existing video cannot be changed.
 *
 * A failure is reported and never fatal: a video with YouTube's own frame grab is worth
 * far more than no video.
 */
function sg_yt_thumbnail($accessToken, $videoId, $article, $jobDir) {
    if (!is_array($article) || $videoId === '') return array('ok' => false, 'error' => 'no article metadata');
    require_once __DIR__ . '/video-lib.php';
    require_once __DIR__ . '/ssr-lib.php';

    $photo = '';
    $own = sg_pick_real_photo($article);
    if (is_array($own) && !empty($own['file'])) {
        $candidate = __DIR__ . '/' . ltrim((string) $own['file'], '/');
        if (is_file($candidate)) $photo = $candidate;
    }
    if ($photo === '' && $jobDir !== '' && is_dir($jobDir)) {
        foreach ((array) glob($jobDir . '/scene*.jpg') as $f) { $photo = $f; break; }
    }

    $dest = ($jobDir !== '' && is_dir($jobDir) ? $jobDir : sys_get_temp_dir()) . '/thumb.jpg';
    if (!sg_render_thumbnail($article, $dest, $photo)) return array('ok' => false, 'error' => 'render failed');

    $ch = curl_init('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=' . rawurlencode($videoId));
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $accessToken, 'Content-Type: image/jpeg'),
        CURLOPT_POSTFIELDS => (string) file_get_contents($dest),
        CURLOPT_TIMEOUT => 120,
    ));
    $raw = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return array(
        'ok' => $code >= 200 && $code < 300,
        'httpCode' => $code,
        'photo' => $photo === '' ? null : basename($photo),
        'detail' => $code >= 300 ? mb_substr($raw, 0, 300, 'UTF-8') : null,
    );
}

$jobId = isset($body['job']) ? basename((string) $body['job']) : '';
if ($jobId !== '') {
    $cronKeys = ['smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026'];
    if (!in_array($body['key'] ?? '', $cronKeys, true)) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'Unauthorized job upload']);
        exit;
    }
    $jobsRoot = is_dir(dirname(__DIR__) . '/video-jobs') ? dirname(__DIR__) . '/video-jobs' : __DIR__ . '/video-jobs';
    // "variant":"slides" picks the copy video-inserts.php wrote beside the render, the one
    // with the presentation cut into it. Without this the only uploadable file is the
    // original video.mp4, so the version worth publishing could not be published.
    $jobDir = $jobsRoot . '/' . $jobId;
    $jobMeta = @json_decode((string) @file_get_contents($jobDir . '/job.json'), true);
    $thumbArticle = is_array($jobMeta) && isset($jobMeta['article']) ? $jobMeta['article'] : null;
    $variant = isset($body['variant']) ? preg_replace('/[^a-z]/', '', (string) $body['variant']) : '';
    $videoFile = $variant === 'slides' ? '/video-slides.mp4' : '/video.mp4';
    $videoPath = $jobsRoot . '/' . $jobId . $videoFile;
    if (!is_file($videoPath)) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'No rendered video for job ' . $jobId
                                                        . ($variant !== '' ? ' (variant ' . $variant . ')' : '')]);
        exit;
    }
    // Under 20MB — every Short — keeps the multipart path that has been uploading fine all
    // along. Above it, the file is left on disk and streamed, because a 200MB episode read
    // into a string and then concatenated into a multipart body needs 400MB of PHP memory
    // to say something curl could have read a block at a time.
    if (filesize($videoPath) <= 20 * 1024 * 1024) {
        $videoBinary = file_get_contents($videoPath);
        $videoPath = null;
    }
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

if ($videoPath === null && ($videoBinary === false || strlen((string) $videoBinary) < 1000)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Decoded video data looks invalid/too small']);
    exit;
}

// #Shorts in the title/description is what routes a vertical <=60s upload into
// the Shorts shelf instead of regular long-form video — so it is exactly the wrong tag on
// a long-form episode, whose whole purpose is to earn watch hours rather than Shorts views.
// Callers that don't say are treated as Shorts, which is what every existing caller is.
$isShort = !array_key_exists('isShort', (array) $body) || !empty($body['isShort']);
if ($isShort && stripos($title . $description, '#shorts') === false) {
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

// ---------------------------------------------------------------------------
// Large file: resumable upload, streamed off disk.
//
// Google's resumable protocol is two calls — post the metadata, get back a URL, then PUT
// the bytes at it. The PUT reads from a file handle, so a 200MB episode never exists as a
// PHP string. The multipart path below stays exactly as it was for Shorts.
// ---------------------------------------------------------------------------
if ($videoPath !== null) {
    $size = filesize($videoPath);

    $initCh = curl_init('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status');
    curl_setopt_array($initCh, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json; charset=UTF-8',
            'X-Upload-Content-Length: ' . $size,
            'X-Upload-Content-Type: ' . $videoMimeType,
        ],
        CURLOPT_POSTFIELDS => $metadata,
        CURLOPT_TIMEOUT => 60,
    ]);
    $initRaw = (string) curl_exec($initCh);
    $initCode = curl_getinfo($initCh, CURLINFO_HTTP_CODE);
    $headerLen = curl_getinfo($initCh, CURLINFO_HEADER_SIZE);
    curl_close($initCh);

    $uploadUrl = '';
    if (preg_match('/^location:\s*(\S+)/mi', substr($initRaw, 0, $headerLen), $m)) $uploadUrl = trim($m[1]);

    if ($initCode < 200 || $initCode >= 300 || $uploadUrl === '') {
        http_response_code(200);
        echo json_encode([
            'success' => false,
            'error' => 'YouTube resumable init failed',
            'httpCode' => $initCode,
            'detail' => substr($initRaw, $headerLen, 2000),
        ]);
        exit;
    }

    $fh = fopen($videoPath, 'rb');
    if (!$fh) {
        http_response_code(200);
        echo json_encode(['success' => false, 'error' => 'Could not open rendered video for upload']);
        exit;
    }

    $putCh = curl_init($uploadUrl);
    curl_setopt_array($putCh, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_UPLOAD => true,
        CURLOPT_INFILE => $fh,
        CURLOPT_INFILESIZE => $size,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: ' . $videoMimeType,
        ],
        // Generous, and paired with set_time_limit above: this is 200MB out of a shared
        // host, and a stall here means a render that already cost twenty minutes is lost.
        CURLOPT_TIMEOUT => 840,
    ]);
    $putRaw = (string) curl_exec($putCh);
    $putCode = curl_getinfo($putCh, CURLINFO_HTTP_CODE);
    $putErr = curl_error($putCh);
    curl_close($putCh);
    fclose($fh);

    $putResult = json_decode($putRaw, true);
    if ($putCode >= 200 && $putCode < 300 && !empty($putResult['id'])) {
        echo json_encode([
            'success' => true,
            'videoId' => $putResult['id'],
            'url' => 'https://youtube.com/watch?v=' . $putResult['id'],
            'bytes' => $size,
            'resumable' => true,
            'privacyStatusRequested' => $privacyStatus,
            'privacyStatusActual' => $putResult['status']['privacyStatus'] ?? null,
            'thumbnail' => sg_yt_thumbnail($accessToken, $putResult['id'], $thumbArticle ?? null, $jobDir ?? ''),
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => false,
            'error' => 'YouTube resumable upload failed',
            'httpCode' => $putCode,
            'curl' => $putErr,
            'detail' => substr($putRaw, 0, 2000),
        ]);
    }
    exit;
}

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
    // What we asked for vs. what YouTube actually stored — these can differ (a channel
    // restriction, an audience-setting rule, a moderation hold) and the insert call still
    // returns 200 with an id either way. Reporting both is what lets a caller notice a
    // 'public' request that silently landed as 'private' instead of assuming it worked.
    echo json_encode([
        'success' => true,
        'videoId' => $result['id'],
        'url' => 'https://youtube.com/shorts/' . $result['id'],
        'privacyStatusRequested' => $privacyStatus,
        'privacyStatusActual' => $result['status']['privacyStatus'] ?? null,
    ]);
} else {
    // Same reason as above — a 5xx here gets swallowed by Cloudflare and the actual
    // YouTube API error never reaches the caller.
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => 'YouTube upload failed', 'httpCode' => $httpCode, 'detail' => $uploadResponse]);
}
