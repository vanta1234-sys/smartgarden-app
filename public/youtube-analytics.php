<?php
/**
 * SmartGarden.gr - What happened to the videos after they were published.
 *
 * Publishing was a one-way street: cron-publish.php pushed an article, a video and a pin
 * every day and nothing ever read back how any of it performed. The one time anyone looked,
 * a number in YouTube Studio (38.5% average view percentage on a 43s video — viewers leaving
 * around 17 seconds) rewrote the whole format. That should not depend on someone happening
 * to open a dashboard.
 *
 * Reports per video: views, likes, average view duration and average view percentage, joined
 * back to the article that produced it so the numbers can be grouped by category and by hook
 * style — which is the question worth answering, not "how did video 4 do".
 *
 * URL: /youtube-analytics.php?key=<cron key>[&days=90]
 */

require_once __DIR__ . '/video-lib.php';

header('Content-Type: application/json; charset=utf-8');
@set_time_limit(120);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

/** Cloudflare replaces origin 5xx bodies with its own page, so errors go out as 200. */
function yt_out($data) {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function yt_get($url, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token),
    ));
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array('status' => $status, 'data' => json_decode((string) $body, true), 'raw' => (string) $body);
}

// ---------------------------------------------------------------- access token
$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$clientSecret = getenv('YOUTUBE_CLIENT_SECRET') ?: '';
$tokensPath = __DIR__ . '/youtube_tokens.json';

if (!$clientId || !$clientSecret || !file_exists($tokensPath)) {
    yt_out(array('success' => false, 'error' => 'YouTube is not connected. Visit /youtube-auth-login.php.'));
}
$tokens = json_decode(file_get_contents($tokensPath), true);
if (empty($tokens['refresh_token'])) {
    yt_out(array('success' => false, 'error' => 'No refresh token stored. Re-run /youtube-auth-login.php.'));
}

$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_POSTFIELDS => http_build_query(array(
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'refresh_token' => $tokens['refresh_token'],
        'grant_type' => 'refresh_token',
    )),
));
$refreshRaw = curl_exec($ch);
curl_close($ch);
$refresh = json_decode((string) $refreshRaw, true);
$accessToken = isset($refresh['access_token']) ? $refresh['access_token'] : null;
if (!$accessToken) {
    yt_out(array('success' => false, 'error' => 'Could not refresh the YouTube access token', 'detail' => $refreshRaw));
}

// The token carries whatever scopes were granted when it was issued. A token minted before
// the analytics scopes were added will refresh perfectly well and then 403 on every read,
// so check up front and say exactly what to do rather than surfacing a raw Google error.
$grantedScopes = isset($refresh['scope']) ? explode(' ', $refresh['scope']) : array();
$hasAnalytics = in_array('https://www.googleapis.com/auth/yt-analytics.readonly', $grantedScopes, true);
$hasReadonly = in_array('https://www.googleapis.com/auth/youtube.readonly', $grantedScopes, true);

if (!$hasAnalytics || !$hasReadonly) {
    yt_out(array(
        'success' => false,
        'error' => 'Ο αποθηκευμένος λογαριασμός YouTube δεν έχει άδεια ανάγνωσης στατιστικών.',
        'action' => 'Άνοιξε https://smartgarden.gr/youtube-auth-login.php και πάτα Αποδοχή. Το ανέβασμα βίντεο συνεχίζει να δουλεύει κανονικά στο μεταξύ.',
        'granted' => $grantedScopes,
        'missing' => array_values(array_filter(array(
            $hasAnalytics ? null : 'yt-analytics.readonly',
            $hasReadonly ? null : 'youtube.readonly',
        ))),
    ));
}

// ---------------------------------------------------------------- our uploads
$chan = yt_get('https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&mine=true', $accessToken);
if ($chan['status'] !== 200 || empty($chan['data']['items'][0])) {
    yt_out(array('success' => false, 'error' => 'Could not read the channel', 'detail' => $chan['raw']));
}
$channel = $chan['data']['items'][0];
$uploadsPlaylist = $channel['contentDetails']['relatedPlaylists']['uploads'] ?? '';

$videoIds = array();
$pageToken = '';
do {
    $url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId='
         . rawurlencode($uploadsPlaylist) . ($pageToken ? '&pageToken=' . rawurlencode($pageToken) : '');
    $page = yt_get($url, $accessToken);
    foreach ($page['data']['items'] ?? array() as $item) {
        if (!empty($item['contentDetails']['videoId'])) $videoIds[] = $item['contentDetails']['videoId'];
    }
    $pageToken = $page['data']['nextPageToken'] ?? '';
} while ($pageToken && count($videoIds) < 200);

if (!count($videoIds)) {
    yt_out(array('success' => true, 'videos' => array(), 'note' => 'Δεν υπάρχουν ακόμη ανεβασμένα βίντεο.'));
}

// Titles, publish dates and public counters.
$meta = array();
foreach (array_chunk($videoIds, 50) as $chunk) {
    $url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=' . implode(',', $chunk);
    $res = yt_get($url, $accessToken);
    foreach ($res['data']['items'] ?? array() as $v) {
        $meta[$v['id']] = array(
            'title' => $v['snippet']['title'] ?? '',
            'publishedAt' => $v['snippet']['publishedAt'] ?? '',
            'privacy' => $v['status']['privacyStatus'] ?? '',
            'duration' => $v['contentDetails']['duration'] ?? '',
            'views' => (int) ($v['statistics']['viewCount'] ?? 0),
            'likes' => (int) ($v['statistics']['likeCount'] ?? 0),
        );
    }
}

// ---------------------------------------------------------------- retention
// Public counters say how many arrived; only the Analytics API says how many stayed.
$days = isset($_GET['days']) ? max(7, min(365, (int) $_GET['days'])) : 90;
$start = gmdate('Y-m-d', time() - $days * 86400);
$end = gmdate('Y-m-d');
$analyticsUrl = 'https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE'
    . '&startDate=' . $start . '&endDate=' . $end
    . '&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage'
    . '&dimensions=video&sort=-views&maxResults=200';
$an = yt_get($analyticsUrl, $accessToken);

$retention = array();
if ($an['status'] === 200 && isset($an['data']['rows'])) {
    foreach ($an['data']['rows'] as $row) {
        $retention[$row[0]] = array(
            'views' => (int) $row[1],
            'minutesWatched' => round((float) $row[2], 2),
            'avgViewSeconds' => round((float) $row[3], 1),
            'avgViewPercent' => round((float) $row[4], 1),
        );
    }
}

// ---------------------------------------------------------------- join to articles
// YouTube titles come from sg_shorten(cleanTitle, 95), so they are a prefix of the article
// title with accents intact. Matching on an accent-folded 30-char prefix is enough to pair
// them without depending on the exact truncation point.
$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
$byPrefix = array();
foreach ($articles as $a) {
    $t = $a['title']['el'] ?? '';
    if ($t === '') continue;
    $key = mb_substr(sg_strip_accents(preg_replace('/[^\p{L}\p{N} ]/u', '', $t)), 0, 30, 'UTF-8');
    $byPrefix[$key] = $a;
}

$rows = array();
foreach ($meta as $id => $m) {
    $key = mb_substr(sg_strip_accents(preg_replace('/[^\p{L}\p{N} ]/u', '', $m['title'])), 0, 30, 'UTF-8');
    $article = $byPrefix[$key] ?? null;
    $r = $retention[$id] ?? null;
    $rows[] = array(
        'videoId' => $id,
        'title' => $m['title'],
        'publishedAt' => $m['publishedAt'],
        'privacy' => $m['privacy'],
        'views' => $m['views'],
        'likes' => $m['likes'],
        'avgViewPercent' => $r['avgViewPercent'] ?? null,
        'avgViewSeconds' => $r['avgViewSeconds'] ?? null,
        'category' => $article['category'] ?? null,
        'hookStyle' => $article ? sg_hook_pool_name($article['title']['el'] ?? '') : null,
        'slug' => $article['slug'] ?? null,
    );
}
usort($rows, function ($a, $b) { return strcmp($b['publishedAt'], $a['publishedAt']); });

/** Average a field across rows that actually have it, so nulls don't drag the mean to zero. */
function yt_group(array $rows, $field) {
    $groups = array();
    foreach ($rows as $r) {
        $k = $r[$field];
        if ($k === null || $r['avgViewPercent'] === null) continue;
        if (!isset($groups[$k])) $groups[$k] = array('videos' => 0, 'views' => 0, 'pct' => 0.0);
        $groups[$k]['videos']++;
        $groups[$k]['views'] += $r['views'];
        $groups[$k]['pct'] += $r['avgViewPercent'];
    }
    foreach ($groups as $k => $g) {
        $groups[$k]['avgViewPercent'] = round($g['pct'] / max(1, $g['videos']), 1);
        unset($groups[$k]['pct']);
    }
    uasort($groups, function ($a, $b) { return $b['avgViewPercent'] <=> $a['avgViewPercent']; });
    return $groups;
}

$withRetention = array_values(array_filter($rows, function ($r) { return $r['avgViewPercent'] !== null; }));

yt_out(array(
    'success' => true,
    'channel' => $channel['snippet']['title'] ?? '',
    'window' => array('from' => $start, 'to' => $end, 'days' => $days),
    'videos' => count($rows),
    'videosWithRetention' => count($withRetention),
    // Stated plainly rather than left for the reader to work out: a handful of videos cannot
    // separate a good topic from a lucky one, and acting on that noise is worse than waiting.
    'verdict' => count($withRetention) < 8
        ? 'Πολύ μικρό δείγμα (' . count($withRetention) . ' βίντεο με στοιχεία). Οι διαφορές ανά κατηγορία δεν είναι ακόμη αξιόπιστες — χρειάζονται τουλάχιστον 8-10.'
        : 'Αρκετό δείγμα για πρώτα συμπεράσματα.',
    'byHookStyle' => yt_group($rows, 'hookStyle'),
    'byCategory' => yt_group($rows, 'category'),
    'rows' => $rows,
));
