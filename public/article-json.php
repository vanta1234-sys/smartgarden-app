<?php
/**
 * SmartGarden.gr - One article's full record, including its body.
 *
 * The list now arrives without article bodies (see articles-index.php), so whichever
 * article the reader opens fetches its own. The article they landed on does not need this
 * — article.php inlines that one into the page.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

$slug = preg_replace('/[^\p{L}\p{N}\-_]/u', '', (string) ($_GET['slug'] ?? ''));
if ($slug === '') {
    echo json_encode(array('error' => 'missing slug'));
    exit;
}

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true);
if (is_array($articles)) {
    foreach ($articles as $a) {
        if (($a['slug'] ?? '') === $slug) {
            require_once __DIR__ . '/ssr-lib.php';
            echo json_encode(sg_repair_article($a), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }
}

http_response_code(404);
echo json_encode(array('error' => 'not found'));
