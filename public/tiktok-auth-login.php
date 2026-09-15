<?php
/**
 * SmartGarden.gr - TikTok OAuth Step 1: redirect the account owner to TikTok's consent screen.
 * URL: https://smartgarden.gr/tiktok-auth-login.php
 * URL: https://smartgarden.gr/tiktok-auth-login.php?sandbox=1  (test mode, before app review)
 */

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';

$clientKey = $isSandbox
    ? (getenv('TIKTOK_SANDBOX_CLIENT_KEY') ?: '')
    : (getenv('TIKTOK_CLIENT_KEY') ?: '');

// redirect_uri must exactly match what's registered with TikTok, so it stays
// identical for both modes — the sandbox flag rides along inside `state` instead.
$redirectUri = 'https://smartgarden.gr/tiktok-auth-callback.php';

if (!$clientKey) {
    http_response_code(500);
    echo 'TikTok client key is not configured on this server.';
    exit;
}

$state = ($isSandbox ? 'sandbox_' : 'prod_') . bin2hex(random_bytes(8));

$query = [
    'client_key' => $clientKey,
    'scope' => 'user.info.basic,video.upload',
    'response_type' => 'code',
    'redirect_uri' => $redirectUri,
    'state' => $state,
];

// ?consent=1 forces TikTok to show the permission screen again even for an account that
// has already authorised this app. Needed to record the app-review demo, which has to show
// the requested scopes on screen: without it the authorize step silently redirects straight
// through, and the alternative is asking the creator to revoke the app first — which TikTok
// only offers in the mobile app, not on the web.
if (isset($_GET['consent'])) {
    $query['disable_auto_auth'] = 1;
}

$params = http_build_query($query);

header('Location: https://www.tiktok.com/v2/auth/authorize/?' . $params);
exit;
