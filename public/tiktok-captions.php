<?php
/**
 * SmartGarden.gr - The TikTok captions of the newest articles, for the phone page /tt.html.
 *
 * TikTok's inbox (draft) upload has no caption field, so the owner pastes the caption in the app. The wording comes from
 * sg_tiktok_caption() in video-lib.php, the same function the video worker uses for a job, so the page and the held-review
 * email always agree. Public and read-only: it only repeats what is already on the site.
 *
 * GET /tiktok-captions.php  ->  {"success":true,"items":[{"slug","title","date","caption"}, ... 10 newest]}
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

require_once __DIR__ . '/video-lib.php';

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true);
if (!is_array($articles)) {
    echo json_encode(array('success' => false, 'error' => 'articles unavailable'));
    exit;
}
// latest_articles.json is already newest first (the site's own order); the older guide-N entries carry d/m/yyyy dates that do not sort as text

$items = array();
foreach (array_slice($articles, 0, 10) as $a) {
    $slug = (string) ($a['slug'] ?? '');
    if ($slug === '') continue;
    $title = is_array($a['title'] ?? null) ? (string) ($a['title']['el'] ?? '') : (string) ($a['title'] ?? '');
    $clean = trim(preg_replace('/[\(\):]/u', '', $title));
    $items[] = array(
        'slug' => $slug,
        'title' => $title,
        'date' => (string) ($a['date'] ?? ''),
        'caption' => sg_tiktok_caption($clean, $slug),
    );
}
echo json_encode(array('success' => true, 'items' => $items), JSON_UNESCAPED_UNICODE);
