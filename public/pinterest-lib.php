<?php
/**
 * SmartGarden.gr - Keeping the Pinterest token alive.
 *
 * pinterest-auth-callback.php stores an access token, a refresh token and an expires_at —
 * and until now nothing ever used the last two. Pinterest access tokens last 30 days, so
 * the auto-pinning wired into cron-publish.php was going to stop working around
 * 2026-10-15 and say nothing, because the publish deliberately ignores the API's answer so
 * that a Pinterest outage can never fail an article.
 *
 * Pinterest is the only traffic channel this site has that works today, so it is worth one
 * refresh call a month and a line in a log.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/**
 * The current access token, refreshed if it is close to expiring.
 *
 * Returns array(token|null, note) — the note says what happened, for the caller to log.
 */
function sg_pinterest_token($dir = null) {
    $dir = $dir ?: __DIR__;
    $path = $dir . '/pinterest_tokens.json';
    if (!file_exists($path)) return array(null, 'Δεν υπάρχει pinterest_tokens.json');

    $t = json_decode((string) @file_get_contents($path), true);
    if (!is_array($t) || empty($t['access_token'])) return array(null, 'Άκυρο pinterest_tokens.json');

    // Three days of margin: the cron runs daily, so there is always another chance before
    // the token actually dies.
    $expiresAt = (int) ($t['expires_at'] ?? 0);
    if ($expiresAt && $expiresAt - time() > 3 * 86400) {
        return array($t['access_token'], 'ok');
    }
    if (empty($t['refresh_token'])) {
        return array($t['access_token'], 'Λήγει σύντομα και δεν υπάρχει refresh_token — χρειάζεται νέα σύνδεση');
    }

    $clientId = getenv('PINTEREST_APP_ID') ?: '';
    $clientSecret = getenv('PINTEREST_APP_SECRET') ?: '';
    if (!$clientId || !$clientSecret) {
        return array($t['access_token'], 'Λείπουν τα PINTEREST_APP_ID/SECRET');
    }

    $ch = curl_init('https://api.pinterest.com/v5/oauth/token');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_USERPWD => $clientId . ':' . $clientSecret,
        CURLOPT_HTTPHEADER => array('Content-Type: application/x-www-form-urlencoded'),
        CURLOPT_POSTFIELDS => http_build_query(array(
            'grant_type' => 'refresh_token',
            'refresh_token' => $t['refresh_token'],
        )),
    ));
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode((string) $raw, true);
    if ($status !== 200 || empty($data['access_token'])) {
        // The old token may still have days left; hand it back rather than pinning nothing.
        return array($t['access_token'], 'Η ανανέωση απέτυχε (HTTP ' . $status . ')');
    }

    $t['access_token'] = $data['access_token'];
    $t['expires_at'] = time() + (int) ($data['expires_in'] ?? 2592000);
    // Pinterest returns a new refresh token only sometimes; keep the old one otherwise.
    if (!empty($data['refresh_token'])) $t['refresh_token'] = $data['refresh_token'];
    @file_put_contents($path, json_encode($t, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    return array($t['access_token'], 'ανανεώθηκε, λήγει ' . gmdate('Y-m-d', $t['expires_at']));
}

/**
 * Append one line to the pin log.
 *
 * The log holds slugs, pin ids and error text — nothing secret — but it is denied in
 * .htaccess anyway, because an operational log is not something a visitor needs.
 */
function sg_pinterest_log(array $entry, $dir = null) {
    $dir = $dir ?: __DIR__;
    $path = $dir . '/pinterest_posts.json';
    $log = json_decode((string) @file_get_contents($path), true);
    if (!is_array($log)) $log = array();
    $entry['at'] = gmdate('c');
    $log[] = $entry;
    if (count($log) > 200) $log = array_slice($log, -200);
    @file_put_contents($path, json_encode($log, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}
