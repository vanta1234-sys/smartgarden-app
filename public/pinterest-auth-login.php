<?php
/**
 * SmartGarden.gr - Pinterest OAuth Step 1.
 * Requires PINTEREST_APP_ID / PINTEREST_APP_SECRET (SetEnv in .htaccess, same
 * pattern as TikTok/Gemini). Register an app at developers.pinterest.com,
 * add redirect URI https://smartgarden.gr/pinterest-auth-callback.php,
 * request scopes: pins:read, pins:write, boards:read, boards:write.
 * URL: https://smartgarden.gr/pinterest-auth-login.php
 */

$clientId = getenv('PINTEREST_APP_ID') ?: '';
$redirectUri = 'https://smartgarden.gr/pinterest-auth-callback.php';

if (!$clientId) {
    http_response_code(500);
    echo 'PINTEREST_APP_ID is not configured yet. Register an app at developers.pinterest.com first.';
    exit;
}

$state = bin2hex(random_bytes(8));
// The state is also kept in a short-lived cookie so the callback can tell that THIS browser started the login (without it anyone could
// complete a consent of their own and have the server store their tokens in place of ours).
setcookie('sg_pin_state', $state, array('expires' => time() + 900, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax'));
$params = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'pins:read,pins:write,boards:read,boards:write,user_accounts:read',
    'state' => $state,
]);

header('Location: https://www.pinterest.com/oauth/?' . $params);
exit;
