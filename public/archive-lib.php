<?php
/**
 * SmartGarden.gr - The article archive.
 *
 * latest_articles.json is read and json_decoded WHOLE on every article view (about 47 KB per
 * entry), so the nightly publish keeps it to the newest 200 entries. Until 2026-11-09 anything
 * past the cap was simply deleted: from 2026-10-27 one evergreen guide vanished every night and
 * its URL turned into a soft 404 (HTTP 200 with the generic guides page). Nothing is deleted any
 * more: the overflow is moved here.
 *
 *   article-archive/<slug>.json   the complete record, one file per article
 *   article-archive/index.json    the same records with `content` emptied, newest first: what the
 *                                 lists (articles-index.php), the category pages (static-meta.php)
 *                                 and the sitemap need, without reading any body
 *
 * Readers: article.php and article-json.php fall back to sg_archive_get() when a slug is not in the
 * catalogue. Writer: cron-publish.php, through sg_archive_overflow(). The directory belongs to the
 * live server (deploy.ts never touches it): there is no copy of it in the repository.
 *
 * Every caller wraps its use in try/catch (Throwable) and treats "no archive" as "nothing archived",
 * so a fault in this file can never take a page down.
 */

/** Where the archive lives. A test can point it elsewhere with $GLOBALS['sg_archive_dir_override']. */
function sg_archive_dir() {
    if (!empty($GLOBALS['sg_archive_dir_override'])) return rtrim($GLOBALS['sg_archive_dir_override'], '/');
    return __DIR__ . '/article-archive';
}

/** A slug is only ever used as (part of) a file name when it holds nothing but letters, digits, - and _. */
function sg_archive_valid_slug($slug) {
    if (!is_string($slug) || $slug === '' || strlen($slug) > 200) return false;
    return preg_replace('/[^\p{L}\p{N}\-_]/u', '', $slug) === $slug;
}

/** The file of one article. Plain ASCII slugs keep their name; anything else (the Greek slugs of old articles) gets a hash name. */
function sg_archive_file($slug) {
    if (preg_match('/^[A-Za-z0-9_\-]{1,150}$/', $slug)) return sg_archive_dir() . '/' . $slug . '.json';
    return sg_archive_dir() . '/u-' . sha1($slug) . '.json';
}

/** One archived article (the full record) or null. */
function sg_archive_get($slug) {
    $slug = preg_replace('/[^\p{L}\p{N}\-_]/u', '', (string) $slug);
    if (!sg_archive_valid_slug($slug)) return null;
    $file = sg_archive_file($slug);
    if (!is_file($file)) return null;
    $a = json_decode((string) @file_get_contents($file), true);
    return (is_array($a) && ($a['slug'] ?? '') === $slug) ? $a : null;
}

/** Every archived article without its body, newest first. */
function sg_archive_index() {
    $file = sg_archive_dir() . '/index.json';
    if (!is_file($file)) return array();
    $a = json_decode((string) @file_get_contents($file), true);
    return is_array($a) ? $a : array();
}

/** Last change of the index, for callers that cache what they build from it. */
function sg_archive_index_mtime() {
    $t = @filemtime(sg_archive_dir() . '/index.json');
    return $t ? (int) $t : 0;
}

function sg_archive_write_atomic($path, $data) {
    $tmp = $path . '.tmp' . getmypid();
    if (@file_put_contents($tmp, $data, LOCK_EX) === false) return false;
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/**
 * Moves everything beyond the newest $cap entries of $articles into the archive and returns the
 * shortened list. The list is newest first, so the overflow is its tail.
 *
 * Nothing is ever lost: an entry leaves the list only after its own file is on disk AND the index
 * that lists it has been written. An entry that cannot be archived (unusable slug, unwritable disk)
 * simply stays in the list, which then runs a little over the cap.
 */
function sg_archive_overflow(array $articles, $cap) {
    if (count($articles) <= $cap) return $articles;

    $dir = sg_archive_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
        error_log('sg_archive_overflow: cannot create ' . $dir . ', keeping every article in the catalogue');
        return $articles;
    }

    $keep = array_slice($articles, 0, $cap);
    $over = array_slice($articles, $cap);
    $stored = array();
    $leftover = array();
    foreach ($over as $a) {
        $slug = is_array($a) && isset($a['slug']) ? $a['slug'] : '';
        $json = sg_archive_valid_slug($slug) ? json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : false;
        if ($json === false || !sg_archive_write_atomic(sg_archive_file($slug), $json)) {
            error_log('sg_archive_overflow: could not archive "' . (is_string($slug) ? $slug : '?') . '", it stays in the catalogue');
            $leftover[] = $a;
            continue;
        }
        $record = $a;
        $record['content'] = array('el' => '', 'en' => '');
        $stored[] = $record;
    }
    if (!count($stored)) return $articles;

    // This batch was ahead of everything archived earlier in the list's order, so it goes first.
    $storedSlugs = array();
    foreach ($stored as $r) $storedSlugs[$r['slug']] = true;
    $index = $stored;
    foreach (sg_archive_index() as $r) {
        if (!isset($r['slug']) || !isset($storedSlugs[$r['slug']])) $index[] = $r;
    }
    $indexJson = json_encode($index, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($indexJson === false || !sg_archive_write_atomic($dir . '/index.json', $indexJson)) {
        error_log('sg_archive_overflow: could not write the archive index, keeping every article in the catalogue');
        return $articles;
    }

    return array_merge($keep, $leftover);
}
