<?php
/**
 * SmartGarden.gr - Publish to the Facebook Page (Graph API).
 * POST JSON:
 *   { type: "article", articleUrl: "https://smartgarden.gr/article/...", message: "..." }
 *     -> posts to /{page}/feed with a `link` so Facebook renders the real article's
 *        OG title/description/image as a preview card (not a plain text post).
 *   { type: "video", videoBase64: "data:video/webm;base64,...", description: "..." }
 *     -> uploads to /{page}/videos so it lands in the Page's Videos tab (and is
 *        eligible for Reels placement for a short vertical clip), not the feed.
 */
header('Content-Type: application/json; charset=utf-8');
set_time_limit(120);

$pageId = getenv('FACEBOOK_PAGE_ID') ?: '';
$pageToken = getenv('FACEBOOK_PAGE_ACCESS_TOKEN') ?: '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!$pageId || !$pageToken) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Facebook Page not configured (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN missing)']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$type = $body['type'] ?? '';

if ($type === 'article') {
    $articleUrl = trim($body['articleUrl'] ?? '');
    $message = trim($body['message'] ?? '');

    if (!filter_var($articleUrl, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing or invalid articleUrl']);
        exit;
    }

    $ch = curl_init("https://graph.facebook.com/v26.0/{$pageId}/feed");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'message' => $message,
            'link' => $articleUrl,
            'access_token' => $pageToken,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($data['id'])) {
        echo json_encode(['success' => true, 'postId' => $data['id']]);
    } else {
        http_response_code(502);
        echo json_encode(['success' => false, 'error' => 'Facebook post failed', 'detail' => $response]);
    }
    exit;
}

if ($type === 'video') {
    $videoDataUri = $body['videoBase64'] ?? '';
    $description = trim($body['description'] ?? '');

    if (!$videoDataUri || strpos($videoDataUri, 'base64,') === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing or invalid videoBase64']);
        exit;
    }

    list(, $base64Data) = explode('base64,', $videoDataUri, 2);
    $videoBinary = base64_decode($base64Data);
    if ($videoBinary === false || strlen($videoBinary) < 1000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Decoded video data looks invalid/too small']);
        exit;
    }

    // The Graph API's /videos endpoint needs a real multipart file field ("source"),
    // not raw bytes in the body — write to a temp file so CURLFile can stream it.
    $tmpPath = tempnam(sys_get_temp_dir(), 'fbvid_') . '.mp4';
    file_put_contents($tmpPath, $videoBinary);

    $ch = curl_init("https://graph.facebook.com/v26.0/{$pageId}/videos");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => [
            'source' => new CURLFile($tmpPath, 'video/mp4', 'video.mp4'),
            'description' => $description,
            'access_token' => $pageToken,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 100,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    @unlink($tmpPath);

    $data = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($data['id'])) {
        echo json_encode(['success' => true, 'videoId' => $data['id']]);
    } else {
        http_response_code(502);
        echo json_encode(['success' => false, 'error' => 'Facebook video upload failed', 'detail' => $response]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'type must be "article" or "video"']);
