<?php
/**
 * SmartGarden.gr - What readers are actually asking for.
 *
 * Topics come from a hand-written pool in cron-publish.php. Nothing has ever fed reader
 * demand back into it, so the site writes what someone thought of months ago rather than
 * what people are turning up wanting.
 *
 * Two honest sources, both ours:
 *   1. Questions submitted to /rotiste — people typing what they want to know, unprompted.
 *   2. Google Search Console — the queries already bringing traffic, and the ones where the
 *      site sits just off page one, which is where a single article moves the most.
 *
 * Reports only. It does not touch the topic pool: a suggestion a person glanced at is worth
 * more than an automatic decision nobody saw.
 *
 * URL: /research.php?key=<cron key>[&days=90]
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

function rs_out($data) {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Words that carry no topic on their own. Without this the top of every list is "για", "το",
// "μου" and the actual subject never surfaces.
$STOP = array(
    'και','για','την','τον','της','του','των','στο','στη','στον','στην','στα','στις','που','ποια','ποιο','ποιος',
    'ειναι','είναι','εχω','έχω','εχει','έχει','μου','σου','μας','απο','από','με','σε','να','θα','δεν','μην','αν',
    'τι','πως','πώς','ποτε','πότε','γιατι','γιατί','ενα','ένα','μια','μία','ο','η','το','οι','τα','ως','κατα','κάτω',
    'πολυ','πολύ','καλα','καλά','μετα','μετά','πριν','οταν','όταν','αλλα','αλλά','ή','εναν','καθε','κάθε','αυτο','αυτό',
);

/** Greek-aware word split, accent-folded, stopwords and short tokens dropped. */
function rs_keywords($text, array $stop) {
    $norm = sg_strip_accents((string) $text);
    $words = preg_split('/[^\p{L}\p{N}]+/u', $norm, -1, PREG_SPLIT_NO_EMPTY);
    $out = array();
    foreach ($words as $w) {
        if (mb_strlen($w, 'UTF-8') < 4) continue;
        if (in_array($w, $stop, true)) continue;
        $out[] = $w;
    }
    return $out;
}

/**
 * Greek inflects heavily, so "γλάστρα", "γλάστρες" and "γλάστρας" are three tokens for one
 * idea. Folding to a stem keeps them counted together.
 */
function rs_stem($w) {
    $len = mb_strlen($w, 'UTF-8');
    return $len >= 7 ? mb_substr($w, 0, $len - 2, 'UTF-8') : $w;
}

// ============================================================ 1. reader questions
$questions = json_decode((string) @file_get_contents(__DIR__ . '/qa_questions.json'), true) ?: array();
$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();

// Everything already written about, as one folded haystack, so "covered" means covered.
$covered = '';
foreach ($articles as $a) {
    $covered .= ' ' . sg_strip_accents(($a['title']['el'] ?? '') . ' ' . ($a['summary']['el'] ?? ''));
}

$qCounts = array();
$qExamples = array();
foreach ($questions as $q) {
    $text = (string) ($q['question'] ?? '');
    if (trim($text) === '') continue;
    foreach (array_unique(rs_keywords($text, $STOP)) as $w) {
        $stem = rs_stem($w);
        if (!isset($qCounts[$stem])) { $qCounts[$stem] = 0; $qExamples[$stem] = $w; }
        $qCounts[$stem]++;
    }
}
arsort($qCounts);

$askedTopics = array();
foreach (array_slice($qCounts, 0, 40, true) as $stem => $n) {
    $askedTopics[] = array(
        'term' => $qExamples[$stem],
        'timesAsked' => $n,
        // A term people keep asking about that no article mentions is the clearest gap
        // this data can produce.
        'alreadyCovered' => mb_strpos($covered, $stem, 0, 'UTF-8') !== false,
    );
}
$gaps = array_values(array_filter($askedTopics, function ($t) {
    return !$t['alreadyCovered'] && $t['timesAsked'] >= 2;
}));

// ============================================================ 2. search console
$searchConsole = array('available' => false);
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

        $scopes = isset($refresh['scope']) ? explode(' ', $refresh['scope']) : array();
        $token = $refresh['access_token'] ?? null;

        if (!$token) {
            $searchConsole = array('available' => false, 'reason' => 'Δεν ανανεώθηκε το token Google.');
        } elseif (!in_array('https://www.googleapis.com/auth/webmasters.readonly', $scopes, true)) {
            $searchConsole = array(
                'available' => false,
                'reason' => 'Ο λογαριασμός δεν έχει άδεια για Search Console.',
                'action' => 'Άνοιξε https://smartgarden.gr/youtube-auth-login.php και πάτα Αποδοχή — η ίδια σύνδεση καλύπτει και τα στατιστικά YouTube.',
            );
        } else {
            // Which property exists is not knowable from here: a site can be verified as a
            // domain property (sc-domain:) or as a URL prefix (https://...), and asking for
            // the wrong one returns a permission error that reads like the account has no
            // access at all. Ask Google which ones it has and match.
            $ch = curl_init('https://www.googleapis.com/webmasters/v3/sites');
            curl_setopt_array($ch, array(
                CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token),
            ));
            $sitesRaw = curl_exec($ch);
            $sitesStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $sites = json_decode((string) $sitesRaw, true);

            // Reading siteEntry straight off a failed response turns "the call broke" into
            // "you own no sites" — two completely different problems wearing the same face.
            if ($sitesStatus !== 200) {
                $searchConsole = array(
                    'available' => false,
                    'reason' => 'Η λίστα ιδιοκτησιών Search Console απάντησε HTTP ' . $sitesStatus . '.',
                    'detail' => $sites['error']['message'] ?? substr((string) $sitesRaw, 0, 400),
                );
                rs_out(array(
                    'success' => true,
                    'readerQuestions' => array('total' => count($questions), 'topTerms' => array_slice($askedTopics, 0, 20), 'uncoveredGaps' => $gaps),
                    'searchConsole' => $searchConsole,
                    'articlesPublished' => count($articles),
                ));
            }

            $entries = $sites['siteEntry'] ?? array();
            $siteUrl = null;
            foreach ($entries as $e) {
                if (stripos($e['siteUrl'] ?? '', 'smartgarden.gr') !== false) { $siteUrl = $e['siteUrl']; break; }
            }

            if (!$siteUrl) {
                $searchConsole = array(
                    'available' => false,
                    'reason' => 'Ο λογαριασμός δεν έχει καμία επαληθευμένη ιδιοκτησία για το smartgarden.gr στο Search Console.',
                    'action' => 'Πήγαινε στο https://search.google.com/search-console, πρόσθεσε το smartgarden.gr και επαλήθευσέ το με τον ίδιο λογαριασμό Google.',
                    'propertiesFound' => array_map(function ($e) { return $e['siteUrl']; }, $entries),
                );
                rs_out(array(
                    'success' => true,
                    'readerQuestions' => array(
                        'total' => count($questions),
                        'topTerms' => array_slice($askedTopics, 0, 20),
                        'uncoveredGaps' => $gaps,
                    ),
                    'searchConsole' => $searchConsole,
                    'articlesPublished' => count($articles),
                ));
            }

            $days = isset($_GET['days']) ? max(7, min(480, (int) $_GET['days'])) : 90;
            $body = json_encode(array(
                'startDate' => gmdate('Y-m-d', time() - $days * 86400),
                'endDate' => gmdate('Y-m-d'),
                'dimensions' => array('query'),
                'rowLimit' => 200,
            ));
            $ch = curl_init('https://www.googleapis.com/webmasters/v3/sites/'
                . rawurlencode($siteUrl) . '/searchAnalytics/query');
            curl_setopt_array($ch, array(
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 45,
                CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token, 'Content-Type: application/json'),
                CURLOPT_POSTFIELDS => $body,
            ));
            $raw = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $data = json_decode((string) $raw, true);

            if ($status === 200) {
                $rows = $data['rows'] ?? array();
                $striking = array();
                foreach ($rows as $r) {
                    $pos = (float) ($r['position'] ?? 99);
                    // Positions 5-20 are where the site is already relevant enough to be
                    // shown but not enough to be clicked. Moving one of these beats
                    // starting a subject from nothing.
                    if ($pos >= 5 && $pos <= 20 && ($r['impressions'] ?? 0) >= 5) {
                        $striking[] = array(
                            'query' => $r['keys'][0] ?? '',
                            'impressions' => (int) ($r['impressions'] ?? 0),
                            'clicks' => (int) ($r['clicks'] ?? 0),
                            'position' => round($pos, 1),
                        );
                    }
                }
                usort($striking, function ($a, $b) { return $b['impressions'] <=> $a['impressions']; });

                // While the site is new, striking distance is empty — nothing ranks 5-20
                // yet — and reporting only that says nothing at all. The queries Google is
                // already showing the site for, at whatever position, are the only real
                // evidence of what it is understood to be about.
                $top = array();
                foreach ($rows as $r) {
                    $top[] = array(
                        'query' => $r['keys'][0] ?? '',
                        'impressions' => (int) ($r['impressions'] ?? 0),
                        'clicks' => (int) ($r['clicks'] ?? 0),
                        'position' => round((float) ($r['position'] ?? 99), 1),
                    );
                }
                usort($top, function ($a, $b) { return $b['impressions'] <=> $a['impressions']; });

                $searchConsole = array(
                    'available' => true,
                    'property' => $siteUrl,
                    'totalQueries' => count($rows),
                    'totalImpressions' => array_sum(array_column($top, 'impressions')),
                    'totalClicks' => array_sum(array_column($top, 'clicks')),
                    'strikingDistance' => array_slice($striking, 0, 25),
                    'topQueries' => array_slice($top, 0, 30),
                );
            } else {
                $searchConsole = array(
                    'available' => false,
                    'reason' => 'Το Search Console απάντησε HTTP ' . $status . '.',
                    'hint' => 'Συνήθως: το smartgarden.gr δεν είναι επαληθευμένο στο Search Console με αυτόν τον λογαριασμό, ή το Search Console API δεν είναι ενεργοποιημένο στο project του Google Cloud.',
                    'detail' => $data['error']['message'] ?? substr((string) $raw, 0, 300),
                );
            }
        }
    }
}

rs_out(array(
    'success' => true,
    'readerQuestions' => array(
        'total' => count($questions),
        'note' => count($questions) < 10
            ? 'Λίγες ερωτήσεις ακόμη (' . count($questions) . ') — τα μοτίβα δεν είναι αξιόπιστα.'
            : 'Αρκετές ερωτήσεις για να φανούν μοτίβα.',
        'topTerms' => array_slice($askedTopics, 0, 20),
        'uncoveredGaps' => $gaps,
    ),
    'searchConsole' => $searchConsole,
    'articlesPublished' => count($articles),
));
