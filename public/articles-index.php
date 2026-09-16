<?php
/**
 * SmartGarden.gr - The article list without the articles.
 *
 * Every visitor fetched latest_articles.json: 2.4MB of JSON, 71 complete article bodies,
 * 88% of it text for articles they were not reading. This serves the same records with
 * `content` emptied — the fields the lists, cards and metadata actually use — and the one
 * article being read arrives inlined by article.php or from article-json.php.
 *
 * `content` is emptied rather than removed: the reader renders content.el directly and a
 * missing key throws.
 *
 * Cached to disk and rebuilt only when latest_articles.json changes, so the daily publish
 * is picked up without this re-encoding 2.4MB on every request.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

$src = __DIR__ . '/latest_articles.json';
$cache = __DIR__ . '/articles-index.cache.json';

if (!file_exists($src)) {
    echo '[]';
    exit;
}

if (file_exists($cache) && filemtime($cache) >= filemtime($src)) {
    readfile($cache);
    exit;
}

$articles = json_decode((string) file_get_contents($src), true);
if (!is_array($articles)) {
    echo '[]';
    exit;
}

foreach ($articles as &$a) {
    $a['content'] = array('el' => '', 'en' => '');
}
unset($a);

$json = json_encode($articles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    // Never leave the reader with nothing: fall back to the full file rather than an error.
    readfile($src);
    exit;
}
@file_put_contents($cache, $json);
echo $json;
