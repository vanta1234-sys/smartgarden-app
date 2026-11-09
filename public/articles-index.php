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

// Rebuild when the data changes, and also when this script or ssr-lib.php does — the text
// repair lives in ssr-lib, and a cache keyed on the data alone would serve the broken
// version until the next publish.
// The archive (archive-lib.php) holds the articles past the catalogue cap; they stay in the list so the
// reader and the counts see every article. It changes the list too, so its files are part of the cache key.
$archiveMtime = 0;
try {
    require_once __DIR__ . '/archive-lib.php';
    $archiveMtime = max(sg_archive_index_mtime(), @filemtime(__DIR__ . '/archive-lib.php') ?: 0);
} catch (\Throwable $archiveError) {
    // no archive: the list is just the catalogue
}
$newest = max(filemtime($src), filemtime(__FILE__), @filemtime(__DIR__ . '/ssr-lib.php') ?: 0, $archiveMtime);
if (file_exists($cache) && filemtime($cache) >= $newest) {
    readfile($cache);
    exit;
}

$articles = json_decode((string) file_get_contents($src), true);
if (!is_array($articles)) {
    echo '[]';
    exit;
}

require_once __DIR__ . '/ssr-lib.php';
foreach ($articles as &$a) {
    $a = sg_repair_article($a);
    $a['content'] = array('el' => '', 'en' => '');
}
unset($a);

// Archived articles come after the catalogue: they are the oldest ones.
if ($archiveMtime) {
    try {
        foreach (sg_archive_index() as $archived) {
            $archived = sg_repair_article($archived);
            $archived['content'] = array('el' => '', 'en' => '');
            $articles[] = $archived;
        }
    } catch (\Throwable $archiveError) {
        // the catalogue alone is still a complete list of what is live
    }
}

$json = json_encode($articles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    // Never leave the reader with nothing: fall back to the full file rather than an error.
    readfile($src);
    exit;
}
@file_put_contents($cache, $json);
echo $json;
