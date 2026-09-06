<?php
/**
 * SmartGarden.gr - Real TikTok Content Posting API integration.
 * Uploads a video as a draft to the connected creator's TikTok inbox
 * (the creator still has to tap "Post" inside the TikTok app — this is the
 * `video.upload` scope, not the auditable `video.publish` direct-post scope).
 * URL: https://smartgarden.gr/tiktok-publish.php
 */

header('Content-Type: application/json; charset=utf-8');

function fail($code, $payload) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';
$clientKey = $isSandbox ? (getenv('TIKTOK_SANDBOX_CLIENT_KEY') ?: '') : (getenv('TIKTOK_CLIENT_KEY') ?: '');
$clientSecret = $isSandbox ? (getenv('TIKTOK_SANDBOX_CLIENT_SECRET') ?: '') : (getenv('TIKTOK_CLIENT_SECRET') ?: '');
$tokensPath = __DIR__ . '/' . ($isSandbox ? 'tiktok_tokens_sandbox.json' : 'tiktok_tokens.json');

if (!file_exists($tokensPath)) {
    fail(401, ['success' => false, 'connected' => false, 'error' => 'Ο λογαριασμός TikTok δεν είναι συνδεδεμένος ακόμα.', 'loginUrl' => '/tiktok-auth-login.php' . ($isSandbox ? '?sandbox=1' : '')]);
}

$tokens = json_decode(file_get_contents($tokensPath), true);
$accessToken = $tokens['access_token'] ?? null;

// Refresh the token if it's expired (or about to expire)
if ($accessToken && !empty($tokens['expires_at']) && time() > ($tokens['expires_at'] - 60) && !empty($tokens['refresh_token'])) {
    $ch = curl_init('https://open.tiktokapis.com/v2/oauth/token/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_POSTFIELDS => http_build_query([
            'client_key' => $clientKey,
            'client_secret' => $clientSecret,
            'grant_type' => 'refresh_token',
            'refresh_token' => $tokens['refresh_token'],
        ]),
    ]);
    $refreshResp = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!empty($refreshResp['access_token'])) {
        $tokens = [
            'access_token' => $refreshResp['access_token'],
            'refresh_token' => $refreshResp['refresh_token'] ?? $tokens['refresh_token'],
            'open_id' => $refreshResp['open_id'] ?? $tokens['open_id'],
            'expires_at' => time() + (int)($refreshResp['expires_in'] ?? 3600),
        ];
        file_put_contents($tokensPath, json_encode($tokens, JSON_PRETTY_PRINT));
        $accessToken = $tokens['access_token'];
    }
}

if (!$accessToken) {
    fail(401, ['success' => false, 'connected' => false, 'error' => 'TikTok token unavailable.']);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$videoBase64 = $input['videoBase64'] ?? null;
$videoUrl = $input['videoUrl'] ?? null;
$caption = $input['caption'] ?? '';
$title = $input['title'] ?? 'SmartGarden Daily Tip';
$articleId = $input['articleId'] ?? 'custom';

if ($videoBase64) {
    $clean = preg_replace('#^data:video/[a-z0-9]+;base64,#i', '', $videoBase64);
    $videoBytes = base64_decode($clean);
} elseif ($videoUrl) {
    $absoluteUrl = strpos($videoUrl, 'http') === 0 ? $videoUrl : ('https://smartgarden.gr' . $videoUrl);
    $videoBytes = @file_get_contents($absoluteUrl);
} else {
    fail(400, ['success' => false, 'error' => 'Missing videoBase64 or videoUrl. TikTok Studio needs an actual rendered .mp4, not a placeholder image.']);
}

if (!$videoBytes) {
    fail(400, ['success' => false, 'error' => 'Could not read video data (empty or unreachable).']);
}

$videoSize = strlen($videoBytes);

// Step 1: initialize the upload (draft/inbox — creator manually posts from the TikTok app)
$ch = curl_init('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json; charset=UTF-8',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'source_info' => [
            'source' => 'FILE_UPLOAD',
            'video_size' => $videoSize,
            'chunk_size' => $videoSize,
            'total_chunk_count' => 1,
        ],
    ]),
]);
$initResp = json_decode(curl_exec($ch), true);
curl_close($ch);

$uploadUrl = $initResp['data']['upload_url'] ?? null;
$publishId = $initResp['data']['publish_id'] ?? null;

if (!$uploadUrl) {
    fail(500, ['success' => false, 'error' => 'TikTok init failed', 'details' => $initResp]);
}

// Step 2: upload the raw video bytes
$ch = curl_init($uploadUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Content-Type: video/mp4',
        'Content-Range: bytes 0-' . ($videoSize - 1) . '/' . $videoSize,
    ],
    CURLOPT_POSTFIELDS => $videoBytes,
]);
$uploadResp = curl_exec($ch);
$uploadStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($uploadStatus < 200 || $uploadStatus >= 300) {
    fail(500, ['success' => false, 'error' => 'TikTok video upload failed', 'details' => $uploadResp]);
}

// Log locally so TikTok Studio's history view has something real to show
$logPath = __DIR__ . '/tiktok_posts.json';
$posts = file_exists($logPath) ? (json_decode(file_get_contents($logPath), true) ?: []) : [];
$newPost = [
    'id' => $publishId ?: ('tt-post-' . time()),
    'articleId' => $articleId,
    'title' => $title,
    'caption' => $caption,
    'status' => 'draft_uploaded',
    'platform' => 'TikTok',
    'publishedAt' => date('c'),
];
array_unshift($posts, $newPost);
file_put_contents($logPath, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'post' => $newPost,
    'message' => 'Το βίντεο ανέβηκε ως draft στο TikTok inbox — άνοιξε την εφαρμογή TikTok για να το δημοσιεύσεις.',
], JSON_UNESCAPED_UNICODE);
