<?php
/**
 * SmartGarden.gr - One-time (or occasional) bulk IndexNow submission of every live
 * article URL, so Bing/Yandex learn about the whole catalogue immediately instead of
 * only URLs published after IndexNow was wired in.
 *
 * /indexnow-submit-all.php?key=<cron key>
 */
require_once __DIR__ . '/indexnow-lib.php';
header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
$urls = array('https://smartgarden.gr/');
foreach ($articles as $a) {
    if (!empty($a['slug'])) $urls[] = 'https://smartgarden.gr/article/' . rawurlencode($a['slug']);
}

// IndexNow accepts up to 10,000 URLs per request; this catalogue is nowhere near that,
// so one request covers everything.
$result = sg_indexnow_submit($urls);

echo json_encode(array(
    'success' => $result['ok'],
    'httpCode' => $result['httpCode'],
    'urlCount' => count($urls),
    'raw' => $result['raw'],
), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
