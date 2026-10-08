<?php
/**
 * SmartGarden.gr - What the Pinterest pins have actually done.
 *
 * The auto-pinning in cron-publish.php posts one pin per new article, but nothing ever read
 * back whether anyone saw it: 17 pins, 0 followers, and no idea whether more pins would help
 * or just look like spam on a brand-new account. This is read-only: it asks Pinterest for the
 * account summary, the account-level impressions/clicks/saves over a window, and the same
 * numbers per pin, and prints them as JSON. It creates, edits and deletes nothing.
 *
 * URL: /pinterest-stats.php?key=<cron key>[&days=30]   (days: 1-89, Pinterest's own limit is 90)
 *
 * Errors go out as HTTP 200 with success:false, because Cloudflare replaces an origin 5xx
 * body with its own page and the reason would never be visible.
 */

require_once __DIR__ . '/pinterest-lib.php';

header('Content-Type: application/json; charset=utf-8');
@set_time_limit(90);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

function ps_out($data) {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ps_get($url, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token),
    ));
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array($status, json_decode((string) $body, true), (string) $body);
}

list($token, $tokenNote) = sg_pinterest_token(__DIR__);
if (!$token) {
    ps_out(array('success' => false, 'error' => 'No Pinterest token', 'note' => $tokenNote));
}

$days = isset($_GET['days']) ? max(1, min(89, (int) $_GET['days'])) : 30;
$end = date('Y-m-d', strtotime('yesterday'));
$start = date('Y-m-d', strtotime('-' . $days . ' days', strtotime($end)));
$metrics = 'IMPRESSION,PIN_CLICK,OUTBOUND_CLICK,SAVE';
$api = 'https://api.pinterest.com/v5';

$out = array('success' => true, 'window' => array('from' => $start, 'to' => $end, 'days' => $days), 'tokenNote' => $tokenNote);

// 1. Account summary.
list($st, $acct) = ps_get($api . '/user_account', $token);
$out['account'] = ($st === 200 && is_array($acct))
    ? array(
        'username' => isset($acct['username']) ? $acct['username'] : null,
        'followers' => isset($acct['follower_count']) ? $acct['follower_count'] : null,
        'following' => isset($acct['following_count']) ? $acct['following_count'] : null,
        'pins' => isset($acct['pin_count']) ? $acct['pin_count'] : null,
        'boards' => isset($acct['board_count']) ? $acct['board_count'] : null,
        'monthlyViews' => isset($acct['monthly_views']) ? $acct['monthly_views'] : null,
        // website_url is the address typed into the profile; it says nothing about whether the
        // domain has been claimed (that is a separate step in Pinterest's settings).
        'websiteUrl' => isset($acct['website_url']) ? $acct['website_url'] : null,
    )
    : array('httpStatus' => $st, 'error' => is_array($acct) ? $acct : null);

// 2. Account-level analytics over the window.
list($st, $an, $raw) = ps_get(
    $api . '/user_account/analytics?start_date=' . $start . '&end_date=' . $end
    . '&metric_types=' . $metrics . '&app_types=ALL&split_field=NO_SPLIT', $token);
if ($st === 200 && is_array($an)) {
    $summary = isset($an['all']['summary_metrics']) ? $an['all']['summary_metrics'] : (isset($an['summary_metrics']) ? $an['summary_metrics'] : null);
    $out['accountTotals'] = $summary !== null ? $summary : array('note' => 'no summary in response', 'raw' => substr($raw, 0, 600));
} else {
    $out['accountTotals'] = array('httpStatus' => $st, 'error' => is_array($an) ? $an : substr($raw, 0, 300));
}

// 3. The pins themselves (newest first, up to 25) with per-pin numbers.
list($st, $pins) = ps_get($api . '/pins?page_size=25', $token);
$rows = array();
if ($st === 200 && isset($pins['items']) && is_array($pins['items'])) {
    foreach ($pins['items'] as $p) {
        $row = array(
            'id' => isset($p['id']) ? $p['id'] : null,
            'created' => isset($p['created_at']) ? $p['created_at'] : null,
            'title' => isset($p['title']) ? mb_substr((string) $p['title'], 0, 70, 'UTF-8') : '',
            'link' => isset($p['link']) ? $p['link'] : null,
        );
        $pinStart = $start;
        if (!empty($p['created_at'])) {
            $created = date('Y-m-d', strtotime($p['created_at']));
            if ($created > $pinStart) $pinStart = $created;
        }
        if (!empty($p['id']) && $pinStart <= $end) {
            list($pst, $pan) = ps_get(
                $api . '/pins/' . rawurlencode($p['id']) . '/analytics?start_date=' . $pinStart . '&end_date=' . $end
                . '&metric_types=' . $metrics . '&app_types=ALL', $token);
            if ($pst === 200 && is_array($pan)) {
                $m = isset($pan['all']['lifetime_metrics']) ? $pan['all']['lifetime_metrics']
                    : (isset($pan['all']['summary_metrics']) ? $pan['all']['summary_metrics'] : null);
                $row['metrics'] = $m !== null ? $m : $pan;
            } else {
                $row['metrics'] = array('httpStatus' => $pst);
            }
        }
        $rows[] = $row;
    }
    $out['pins'] = $rows;
    $totals = array('IMPRESSION' => 0, 'PIN_CLICK' => 0, 'OUTBOUND_CLICK' => 0, 'SAVE' => 0);
    foreach ($rows as $r) {
        if (!isset($r['metrics']) || !is_array($r['metrics'])) continue;
        foreach ($totals as $k => $v) {
            if (isset($r['metrics'][$k])) $totals[$k] += (int) $r['metrics'][$k];
        }
    }
    $out['pinsTotals'] = $totals;
} else {
    $out['pins'] = array('httpStatus' => $st, 'error' => is_array($pins) ? $pins : null);
}

ps_out($out);
