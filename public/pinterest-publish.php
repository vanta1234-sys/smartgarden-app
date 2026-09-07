<?php
/**
 * SmartGarden.gr - Creates a real Pin via the Pinterest v5 API.
 * POST JSON: { boardId, title, description, link, imageUrl }
 * URL: https://smartgarden.gr/pinterest-publish.php
 */

header('Content-Type: application/json; charset=utf-8');

function fail($code, $payload) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$tokensPath = __DIR__ . '/pinterest_tokens.json';
if (!file_exists($tokensPath)) {
    fail(401, ['success' => false, 'connected' => false, 'error' => 'Pinterest account not connected yet.', 'loginUrl' => '/pinterest-auth-login.php']);
}

$tokens = json_decode(file_get_contents($tokensPath), true);
$accessToken = $tokens['access_token'] ?? null;
if (!$accessToken) {
    fail(401, ['success' => false, 'error' => 'No Pinterest access token stored.']);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$boardId = $input['boardId'] ?? '';
$title = $input['title'] ?? '';
$description = $input['description'] ?? '';
$link = $input['link'] ?? 'https://smartgarden.gr';
$imageUrl = $input['imageUrl'] ?? '';

if (!$boardId || !$imageUrl) {
    fail(400, ['success' => false, 'error' => 'Missing boardId or imageUrl. Call /pinterest-boards.php first to list your board IDs.']);
}

$ch = curl_init('https://api.pinterest.com/v5/pins');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'board_id' => $boardId,
        'title' => mb_substr($title, 0, 100),
        'description' => mb_substr($description, 0, 500),
        'link' => $link,
        'media_source' => [
            'source_type' => 'image_url',
            'url' => $imageUrl,
        ],
    ]),
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
if ($status < 200 || $status >= 300 || empty($data['id'])) {
    fail(500, ['success' => false, 'error' => 'Pinterest pin creation failed', 'details' => $data ?: $response]);
}

echo json_encode(['success' => true, 'pinId' => $data['id'], 'message' => 'Pin δημιουργήθηκε επιτυχώς στο Pinterest.'], JSON_UNESCAPED_UNICODE);
