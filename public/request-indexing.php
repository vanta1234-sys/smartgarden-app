<?php
/**
 * SmartGarden.gr - Push existing articles at Google for re-crawling.
 *
 * Every article published before 2026-09-16 was served to crawlers as an empty shell, so
 * Search Console filed 158 of them as duplicates. Now that article.php renders real content,
 * those pages need looking at again — Google will get there on its own eventually, but
 * eventually is measured in weeks.
 *
 * Which articles go first is decided by Search Console: pages already earning impressions
 * are proven to have demand and are worth fixing before anything else. The rest of the
 * quota goes to the newest.
 *
 * URL: /request-indexing.php?key=<cron key>[&limit=10][&dry=1]
 */

require_once __DIR__ . '/indexing-lib.php';

header('Content-Type: application/json; charset=utf-8');
@set_time_limit(180);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

function ri_out($d) {
    echo json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$limit = isset($_GET['limit']) ? max(1, min(50, (int) $_GET['limit'])) : 10;
$dryRun = isset($_GET['dry']);

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
if (!count($articles)) ri_out(array('success' => false, 'error' => 'Δεν βρέθηκαν άρθρα.'));

// ---------------------------------------------------------------- pick the best
// Ask Search Console which article pages already get impressions. A page Google is
// already showing, however badly, has demonstrated demand; one that has never been shown
// is a guess. Falls back to newest-first when that data is not reachable.
$ranked = array();
$rankSource = 'newest';

$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$clientSecret = getenv('YOUTUBE_CLIENT_SECRET') ?: '';
$tokensPath = __DIR__ . '/youtube_tokens.json';
if ($clientId && $clientSecret && file_exists($tokensPath)) {
    $tokens = json_decode(file_get_contents($tokensPath), true);
    if (!empty($tokens['refresh_token'])) {
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 30,
            CURLOPT_POSTFIELDS => http_build_query(array(
                'client_id' => $clientId, 'client_secret' => $clientSecret,
                'refresh_token' => $tokens['refresh_token'], 'grant_type' => 'refresh_token',
            )),
        ));
        $refresh = json_decode((string) curl_exec($ch), true);
        curl_close($ch);
        $gToken = $refresh['access_token'] ?? null;

        if ($gToken) {
            $ch = curl_init('https://www.googleapis.com/webmasters/v3/sites/'
                . rawurlencode('https://smartgarden.gr/') . '/searchAnalytics/query');
            curl_setopt_array($ch, array(
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 45,
                CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $gToken, 'Content-Type: application/json'),
                CURLOPT_POSTFIELDS => json_encode(array(
                    'startDate' => gmdate('Y-m-d', time() - 90 * 86400),
                    'endDate' => gmdate('Y-m-d'),
                    'dimensions' => array('page'),
                    'rowLimit' => 200,
                )),
            ));
            $scRaw = curl_exec($ch);
            $scStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($scStatus === 200) {
                $sc = json_decode((string) $scRaw, true);
                foreach ($sc['rows'] ?? array() as $row) {
                    $page = $row['keys'][0] ?? '';
                    if (strpos($page, '/article/') !== false) {
                        $ranked[$page] = (int) ($row['impressions'] ?? 0);
                    }
                }
                if (count($ranked)) {
                    arsort($ranked);
                    $rankSource = 'search-console-impressions';
                }
            }
        }
    }
}

$urls = array();
$why = array();

// &source=pages submits the non-article URLs instead. They only became worth crawling on
// 2026-09-17, when static-meta.php started rendering a body for them — before that every
// one of them served the same empty shell, which is what Google filed as duplicates.
// Kept separate from the article run because the daily Indexing API quota is 200 and
// submitting all 146 in one day on top of the articles would overrun it.
if (($_GET['source'] ?? '') === 'pages') {
    $sitemap = @file_get_contents(__DIR__ . '/sitemap.xml');
    if (!$sitemap) ri_out(array('success' => false, 'error' => 'Δεν διαβάστηκε το sitemap.xml'));
    preg_match_all('#<loc>([^<]+)</loc>#', $sitemap, $m);
    // &offset skips the ones a previous run already sent — $limit is capped at 50 per call
    // and there are more pages than that.
    $skip = isset($_GET['offset']) ? max(0, (int) $_GET['offset']) : 0;
    $seen = 0;
    foreach ($m[1] as $loc) {
        if (strpos($loc, '/article/') !== false) continue;
        if ($seen++ < $skip) continue;
        if (count($urls) >= $limit) break;
        $urls[] = $loc;
        $why[$loc] = 'σελίδα με νέο περιεχόμενο';
    }
    if ($dryRun) {
        ri_out(array('success' => true, 'dryRun' => true, 'rankedBy' => 'sitemap-pages',
            'wouldSubmit' => array_map(function ($u) { return array('url' => $u); }, $urls)));
    }
    list($token, $err) = sg_indexing_token();
    if (!$token) ri_out(array('success' => false, 'error' => $err));
    $results = array();
    foreach ($urls as $u) { $results[] = sg_submit_url($token, $u); usleep(200000); }
    $ok = count(array_filter($results, function ($r) { return $r['ok']; }));
    ri_out(array('success' => true, 'rankedBy' => 'sitemap-pages', 'submitted' => count($results),
        'accepted' => $ok, 'failed' => count($results) - $ok,
        'failures' => array_values(array_filter($results, function ($r) { return !$r['ok']; }))));
}
foreach (array_keys($ranked) as $page) {
    if (count($urls) >= $limit) break;
    $urls[] = $page;
    $why[$page] = $ranked[$page] . ' εμφανίσεις';
}
foreach ($articles as $a) {
    if (count($urls) >= $limit) break;
    if (empty($a['slug'])) continue;
    $u = 'https://smartgarden.gr/article/' . rawurlencode($a['slug']);
    if (in_array($u, $urls, true)) continue;
    $urls[] = $u;
    $why[$u] = 'πρόσφατο (' . ($a['date'] ?? '') . ')';
}

if ($dryRun) {
    ri_out(array(
        'success' => true, 'dryRun' => true, 'rankedBy' => $rankSource,
        'wouldSubmit' => array_map(function ($u) use ($why) {
            return array('url' => $u, 'reason' => $why[$u] ?? '');
        }, $urls),
    ));
}

// ---------------------------------------------------------------- submit
list($token, $err) = sg_indexing_token();
if (!$token) ri_out(array('success' => false, 'error' => $err));

$results = array();
foreach ($urls as $u) {
    $r = sg_submit_url($token, $u);
    $r['reason'] = $why[$u] ?? '';
    $results[] = $r;
    usleep(250000);
}

$ok = count(array_filter($results, function ($r) { return $r['ok']; }));

ri_out(array(
    'success' => true,
    'rankedBy' => $rankSource,
    'submitted' => count($results),
    'accepted' => $ok,
    'failed' => count($results) - $ok,
    // Acceptance is not indexing. Google takes the request and decides separately, and for
    // ordinary articles it may decline entirely — the documented uses are JobPosting and
    // BroadcastEvent. The real fix was making the pages render server-side.
    'note' => 'Η αποδοχή σημαίνει ότι το αίτημα καταχωρήθηκε, όχι ότι η σελίδα μπήκε στο ευρετήριο. Δες το Search Console σε λίγες μέρες.',
    'results' => $results,
));
