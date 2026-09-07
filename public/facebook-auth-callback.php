<?php
/**
 * SmartGarden.gr - Facebook OAuth Step 2: exchange code for a long-lived Page token.
 * URL: https://smartgarden.gr/facebook-auth-callback.php
 */
header('Content-Type: text/html; charset=utf-8');

$clientId = getenv('FACEBOOK_APP_ID') ?: '';
$clientSecret = getenv('FACEBOOK_APP_SECRET') ?: '';
$redirectUri = 'https://smartgarden.gr/facebook-auth-callback.php';

if (!isset($_GET['code'])) {
    http_response_code(400);
    echo 'Facebook authorization failed: ' . htmlspecialchars($_GET['error_description'] ?? $_GET['error'] ?? 'no code returned', ENT_QUOTES);
    exit;
}

// Step A: exchange the auth code for a short-lived USER access token.
$ch = curl_init('https://graph.facebook.com/v26.0/oauth/access_token?' . http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'client_secret' => $clientSecret,
    'code' => $_GET['code'],
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp = curl_exec($ch);
curl_close($ch);
$data = json_decode($resp, true);

if (empty($data['access_token'])) {
    http_response_code(500);
    echo 'Facebook token exchange failed: ' . htmlspecialchars($resp, ENT_QUOTES);
    exit;
}
$shortUserToken = $data['access_token'];

// Step B: exchange the short-lived user token for a long-lived one (~60 days).
$ch = curl_init('https://graph.facebook.com/v26.0/oauth/access_token?' . http_build_query([
    'grant_type' => 'fb_exchange_token',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'fb_exchange_token' => $shortUserToken,
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp2 = curl_exec($ch);
curl_close($ch);
$data2 = json_decode($resp2, true);
$longUserToken = $data2['access_token'] ?? $shortUserToken;

// Step C: use the long-lived user token to fetch the Page access token — Page
// tokens derived this way don't expire as long as the user stays a Page admin.
$ch = curl_init('https://graph.facebook.com/v26.0/me/accounts?access_token=' . urlencode($longUserToken));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp3 = curl_exec($ch);
curl_close($ch);
$data3 = json_decode($resp3, true);

if (empty($data3['data'][0]['access_token'])) {
    http_response_code(500);
    echo 'Could not fetch a Page access token — do you manage a Facebook Page with this account? Raw response: ' . htmlspecialchars($resp3, ENT_QUOTES);
    exit;
}

$page = $data3['data'][0];
file_put_contents(__DIR__ . '/facebook_tokens.json', json_encode([
    'page_id' => $page['id'],
    'page_name' => $page['name'],
    'page_access_token' => $page['access_token'],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo '✅ Η Σελίδα Facebook "' . htmlspecialchars($page['name'], ENT_QUOTES) . '" συνδέθηκε επιτυχώς με τα σωστά permissions! Μπορείς να κλείσεις αυτή την καρτέλα.';
