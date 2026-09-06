<?php
/**
 * SmartGarden.gr - TikTok OAuth Step 2: exchange the returned code for an access token.
 * URL: https://smartgarden.gr/tiktok-auth-callback.php
 */

header('Content-Type: text/html; charset=utf-8');

if (!isset($_GET['code'])) {
    http_response_code(400);
    echo 'TikTok authorization failed: ' . htmlspecialchars($_GET['error'] ?? 'no code returned', ENT_QUOTES);
    exit;
}

$code = $_GET['code'];
$state = $_GET['state'] ?? '';
$isSandbox = strpos($state, 'sandbox_') === 0;

$clientKey = $isSandbox
    ? (getenv('TIKTOK_SANDBOX_CLIENT_KEY') ?: '')
    : (getenv('TIKTOK_CLIENT_KEY') ?: '');
$clientSecret = $isSandbox
    ? (getenv('TIKTOK_SANDBOX_CLIENT_SECRET') ?: '')
    : (getenv('TIKTOK_CLIENT_SECRET') ?: '');
$redirectUri = 'https://smartgarden.gr/tiktok-auth-callback.php';
$tokensFile = $isSandbox ? 'tiktok_tokens_sandbox.json' : 'tiktok_tokens.json';

$ch = curl_init('https://open.tiktokapis.com/v2/oauth/token/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Cache-Control: no-cache'],
    CURLOPT_POSTFIELDS => http_build_query([
        'client_key' => $clientKey,
        'client_secret' => $clientSecret,
        'code' => $code,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri,
    ]),
]);
$response = curl_exec($ch);
$curlErr = curl_error($ch);
curl_close($ch);

$data = json_decode($response, true);

if (empty($data['access_token'])) {
    http_response_code(500);
    echo 'TikTok token exchange failed: ' . htmlspecialchars($response ?: $curlErr, ENT_QUOTES);
    exit;
}

$tokens = [
    'access_token' => $data['access_token'],
    'refresh_token' => $data['refresh_token'] ?? null,
    'open_id' => $data['open_id'] ?? null,
    'expires_at' => time() + (int)($data['expires_in'] ?? 3600),
];

file_put_contents(__DIR__ . '/' . $tokensFile, json_encode($tokens, JSON_PRETTY_PRINT));

$modeLabel = $isSandbox ? 'Sandbox' : 'Production';
echo "✅ Ο λογαριασμός TikTok συνδέθηκε επιτυχώς! ($modeLabel mode) Μπορείς να κλείσεις αυτή την καρτέλα.";
