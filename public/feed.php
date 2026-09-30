<?php
/**
 * SmartGarden.gr - RSS 2.0 feed of the latest articles.
 *
 * No SPA route ever served this: feed.xml/rss.xml/feed all fell through to the same
 * index.html as every other unknown path (the standard SPA-catchall trap already
 * documented for /privacy, /terms elsewhere in this codebase). A real feed gives feed
 * readers, aggregators and some directory/syndication tools a way to discover new
 * articles without crawling the site, and costs nothing to run.
 *
 * Linked from <head> via <link rel="alternate" type="application/rss+xml"> so feed
 * readers and browsers can auto-discover it.
 */
header('Content-Type: application/rss+xml; charset=utf-8');

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();

function feed_esc($s) {
    return htmlspecialchars((string) $s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

// D/M/Y and Y-m-d both appear across the catalogue (older vs. newer batches) -- accept
// either rather than assuming one, the same lesson already paid for elsewhere in this
// project when a D/M/Y assumption silently dropped every September article from a filter.
function feed_parse_date($raw) {
    $raw = trim((string) $raw);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $raw, $m)) {
        return mktime(0, 0, 0, (int) $m[2], (int) $m[3], (int) $m[1]);
    }
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $raw, $m)) {
        return mktime(0, 0, 0, (int) $m[2], (int) $m[1], (int) $m[3]);
    }
    // Third format found live in the catalogue: "20 Αυγούστου 2026" -- genitive-case Greek
    // month names. Missing this made an August article sort as "now" (today), landing it
    // at the top of the feed as if brand new.
    static $greekMonths = array(
        'Ιανουαρίου' => 1, 'Φεβρουαρίου' => 2, 'Μαρτίου' => 3, 'Απριλίου' => 4,
        'Μαΐου' => 5, 'Μαίου' => 5, 'Ιουνίου' => 6, 'Ιουλίου' => 7, 'Αυγούστου' => 8,
        'Σεπτεμβρίου' => 9, 'Οκτωβρίου' => 10, 'Νοεμβρίου' => 11, 'Δεκεμβρίου' => 12,
    );
    if (preg_match('/^(\d{1,2})\s+(\S+)\s+(\d{4})$/u', $raw, $m) && isset($greekMonths[$m[2]])) {
        return mktime(0, 0, 0, $greekMonths[$m[2]], (int) $m[1], (int) $m[3]);
    }
    return time();
}

usort($articles, function ($a, $b) {
    return feed_parse_date($b['date'] ?? '') <=> feed_parse_date($a['date'] ?? '');
});
$latest = array_slice($articles, 0, 30);

$mostRecentTs = !empty($latest) ? feed_parse_date($latest[0]['date'] ?? '') : time();

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SmartGarden.gr - Οδηγοί Κηπουρικής</title>
    <link>https://smartgarden.gr/</link>
    <atom:link href="https://smartgarden.gr/feed.xml" rel="self" type="application/rss+xml" />
    <description>Επιστημονικοί οδηγοί κηπουρικής για μπαλκόνι και κήπο -- φροντίδα φυτών, άρδευση, λαχανόκηπος και πολλά ακόμα.</description>
    <language>el-GR</language>
    <lastBuildDate><?php echo date(DATE_RSS, $mostRecentTs); ?></lastBuildDate>
<?php foreach ($latest as $a):
    $slug = $a['slug'] ?? '';
    if ($slug === '') continue;
    $title = is_array($a['title'] ?? null) ? ($a['title']['el'] ?? '') : (string) ($a['title'] ?? '');
    $summary = is_array($a['summary'] ?? null) ? ($a['summary']['el'] ?? '') : (string) ($a['summary'] ?? '');
    $url = 'https://smartgarden.gr/article/' . rawurlencode($slug);
    $pubTs = feed_parse_date($a['date'] ?? '');
    $image = (string) ($a['image'] ?? '');
?>
    <item>
      <title><?php echo feed_esc($title); ?></title>
      <link><?php echo feed_esc($url); ?></link>
      <guid isPermaLink="true"><?php echo feed_esc($url); ?></guid>
      <pubDate><?php echo date(DATE_RSS, $pubTs); ?></pubDate>
      <description><?php echo feed_esc($summary); ?></description>
<?php if ($image !== ''): ?>
      <enclosure url="<?php echo feed_esc($image); ?>" type="image/jpeg" />
<?php endif; ?>
    </item>
<?php endforeach; ?>
  </channel>
</rss>
