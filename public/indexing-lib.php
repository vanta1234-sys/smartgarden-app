<?php
/**
 * SmartGarden.gr - Asking Google to look at a URL now.
 *
 * Two independent faults kept this from ever working. The path pointed at a filename that
 * has never existed on the server, and the JWT was assembled with base64_encode where the
 * spec requires base64url — so even with the right key Google would have rejected every
 * signature. Both are fixed here, in one place, rather than in each caller.
 *
 * Worth being straight about the tool: Google documents the Indexing API as supporting
 * JobPosting and BroadcastEvent pages only. Ordinary articles are outside that, and
 * submissions may simply be ignored. It costs nothing to try and it is the mechanism this
 * site was already built around, but a sitemap plus real crawlable HTML is what actually
 * gets pages indexed — which is why article.php now renders its content server-side.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/** JWT wants base64url: +/ become -_ and the padding goes. */
function sg_b64url($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/** The service account key, under either name it has been saved as. */
function sg_service_account() {
    foreach (array('google-service-account.json', 'service-account.json') as $name) {
        $path = __DIR__ . '/' . $name;
        if (file_exists($path)) {
            $sa = json_decode((string) file_get_contents($path), true);
            if ($sa && !empty($sa['private_key']) && !empty($sa['client_email'])) return $sa;
        }
    }
    return null;
}

/** Exchange the service account key for an access token. Returns [token, error]. */
function sg_indexing_token() {
    $sa = sg_service_account();
    if (!$sa) return array(null, 'Δεν βρέθηκε κλειδί service account στον server.');

    $now = time();
    $header = sg_b64url(json_encode(array('alg' => 'RS256', 'typ' => 'JWT')));
    $claim = sg_b64url(json_encode(array(
        'iss' => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/indexing',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $now + 3600,
        'iat' => $now,
    )));

    $signature = '';
    if (!openssl_sign($header . '.' . $claim, $signature, $sa['private_key'], 'SHA256')) {
        return array(null, 'Απέτυχε η υπογραφή του JWT.');
    }
    $jwt = $header . '.' . $claim . '.' . sg_b64url($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_POSTFIELDS => http_build_query(array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        )),
    ));
    $raw = curl_exec($ch);
    curl_close($ch);
    $data = json_decode((string) $raw, true);

    if (empty($data['access_token'])) {
        return array(null, 'Η Google δεν έδωσε token: ' . substr((string) $raw, 0, 300));
    }
    return array($data['access_token'], null);
}

/** Submit one URL. Returns the HTTP status and whatever Google said about it. */
function sg_submit_url($token, $url, $type = 'URL_UPDATED') {
    $ch = curl_init('https://indexing.googleapis.com/v3/urlNotifications:publish');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token, 'Content-Type: application/json'),
        CURLOPT_POSTFIELDS => json_encode(array('url' => $url, 'type' => $type)),
    ));
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode((string) $raw, true);

    return array(
        'url' => $url,
        'http' => $status,
        'ok' => $status >= 200 && $status < 300,
        'error' => $status >= 300 ? ($data['error']['message'] ?? substr((string) $raw, 0, 200)) : null,
    );
}
