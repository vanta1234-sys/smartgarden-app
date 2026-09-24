<?php
/**
 * SmartGarden.gr - Read-only utility: check whether a comma-separated list of video IDs
 * still exist on the channel (and their privacy/title), including private ones -- oembed
 * cannot see those, and a video's owner-authenticated videos.list can. Used to verify a
 * deletion actually happened rather than trusting a screenshot or a "done" click.
 *
 * GET /youtube-check.php?key=<cron key>&ids=id1,id2,id3
 */
header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$clientSecret = getenv('YOUTUBE_CLIENT_SECRET') ?: '';
$tokens = json_decode((string) @file_get_contents(__DIR__ . '/youtube_tokens.json'), true);
if (!$clientId || !$clientSecret || empty($tokens['refresh_token'])) {
    echo json_encode(array('success' => false, 'error' => 'YouTube not connected'));
    exit;
}

$refreshCh = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($refreshCh, array(
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query(array(
        'client_id' => $clientId, 'client_secret' => $clientSecret,
        'refresh_token' => $tokens['refresh_token'], 'grant_type' => 'refresh_token',
    )),
));
$rr = json_decode((string) curl_exec($refreshCh), true);
curl_close($refreshCh);
$accessToken = isset($rr['access_token']) ? $rr['access_token'] : null;
if (!$accessToken) {
    echo json_encode(array('success' => false, 'error' => 'refresh failed', 'detail' => $rr));
    exit;
}

$ids = isset($_GET['ids']) ? $_GET['ids'] : '';
$ch = curl_init('https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=' . rawurlencode($ids));
curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $accessToken),
));
$resp = json_decode((string) curl_exec($ch), true);
curl_close($ch);

$found = array();
foreach ((array) (isset($resp['items']) ? $resp['items'] : array()) as $it) {
    $found[$it['id']] = array(
        'title' => isset($it['snippet']['title']) ? $it['snippet']['title'] : null,
        'duration_hint' => null,
        'privacyStatus' => isset($it['status']['privacyStatus']) ? $it['status']['privacyStatus'] : null,
    );
}

$requested = array_filter(array_map('trim', explode(',', $ids)));
$result = array();
foreach ($requested as $id) {
    $result[$id] = isset($found[$id]) ? array_merge(array('exists' => true), $found[$id]) : array('exists' => false);
}

echo json_encode(array('success' => true, 'videos' => $result), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
