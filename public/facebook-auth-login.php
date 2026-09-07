<?php
/**
 * SmartGarden.gr - Facebook OAuth Step 1.
 * Requires FACEBOOK_APP_ID / FACEBOOK_APP_SECRET (SetEnv in .htaccess).
 * Requires "smartgarden.gr" added to the app's "App Domains" and this exact
 * redirect URI added under Facebook Login > Valid OAuth Redirect URIs:
 * https://smartgarden.gr/facebook-auth-callback.php
 * URL: https://smartgarden.gr/facebook-auth-login.php
 */

$clientId = getenv('FACEBOOK_APP_ID') ?: '';
$redirectUri = 'https://smartgarden.gr/facebook-auth-callback.php';

if (!$clientId) {
    http_response_code(500);
    echo 'FACEBOOK_APP_ID is not configured yet.';
    exit;
}

$state = bin2hex(random_bytes(8));
$params = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'pages_show_list,pages_manage_posts,pages_read_engagement',
    'state' => $state,
]);

header('Location: https://www.facebook.com/v26.0/dialog/oauth?' . $params);
exit;
