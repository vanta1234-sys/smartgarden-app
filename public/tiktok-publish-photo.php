<?php
/**
 * SmartGarden.gr - TikTok Content Posting API: static PHOTO post (no video, no audio).
 * Uploads a single image as a draft to the connected creator's TikTok inbox via
 * MEDIA_UPLOAD mode (the `video.upload` scope covers this too — no Production/
 * video.publish review needed, same as the video draft flow in tiktok-publish.php).
 * The image is referenced by its already-public URL (PULL_FROM_URL) — no file upload
 * step needed, unlike video which has to transfer raw bytes.
 * URL: https://smartgarden.gr/tiktok-publish-photo.php
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
$imageUrl = $input['imageUrl'] ?? null;
$title = mb_substr($input['title'] ?? 'SmartGarden.gr', 0, 90);
$description = mb_substr($input['description'] ?? '', 0, 4000);
$articleId = $input['articleId'] ?? 'custom';

if (!$imageUrl || strpos($imageUrl, 'http') !== 0) {
    fail(400, ['success' => false, 'error' => 'Missing or invalid imageUrl — must be a public https:// image URL.']);
}

$ch = curl_init('https://open.tiktokapis.com/v2/post/publish/content/init/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json; charset=UTF-8',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'post_info' => [
            'title' => $title,
            'description' => $description,
        ],
        'source_info' => [
            'source' => 'PULL_FROM_URL',
            'photo_cover_index' => 0,
            'photo_images' => [$imageUrl],
        ],
        'post_mode' => 'MEDIA_UPLOAD',
        'media_type' => 'PHOTO',
    ]),
]);
$initResp = json_decode(curl_exec($ch), true);
$initStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$publishId = $initResp['data']['publish_id'] ?? null;
if (!$publishId) {
    fail(500, ['success' => false, 'error' => 'TikTok photo post init failed', 'httpStatus' => $initStatus, 'details' => $initResp]);
}

// Log locally so TikTok Studio's history view has something real to show
$logPath = __DIR__ . '/tiktok_posts.json';
$posts = file_exists($logPath) ? (json_decode(file_get_contents($logPath), true) ?: []) : [];
$newPost = [
    'id' => $publishId,
    'articleId' => $articleId,
    'title' => $title,
    'caption' => $description,
    'status' => 'draft_uploaded',
    'platform' => 'TikTok',
    'mediaType' => 'PHOTO',
    'publishedAt' => date('c'),
];
array_unshift($posts, $newPost);
file_put_contents($logPath, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'post' => $newPost,
    'message' => 'Η φωτογραφία ανέβηκε ως draft στο TikTok inbox — άνοιξε την εφαρμογή TikTok για να τη δημοσιεύσεις.',
], JSON_UNESCAPED_UNICODE);
