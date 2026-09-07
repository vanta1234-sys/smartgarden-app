<?php
/**
 * SmartGarden.gr - Pinterest OAuth Step 2: exchange code for token.
 * URL: https://smartgarden.gr/pinterest-auth-callback.php
 */

header('Content-Type: text/html; charset=utf-8');

$clientId = getenv('PINTEREST_APP_ID') ?: '';
$clientSecret = getenv('PINTEREST_APP_SECRET') ?: '';
$redirectUri = 'https://smartgarden.gr/pinterest-auth-callback.php';

if (!isset($_GET['code'])) {
    http_response_code(400);
    echo 'Pinterest authorization failed: ' . htmlspecialchars($_GET['error'] ?? 'no code returned', ENT_QUOTES);
    exit;
}

$ch = curl_init('https://api.pinterest.com/v5/oauth/token');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
        'Content-Type: application/x-www-form-urlencoded',
    ],
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $_GET['code'],
        'redirect_uri' => $redirectUri,
    ]),
]);
$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);

if (empty($data['access_token'])) {
    http_response_code(500);
    echo 'Pinterest token exchange failed: ' . htmlspecialchars($response, ENT_QUOTES);
    exit;
}

file_put_contents(__DIR__ . '/pinterest_tokens.json', json_encode([
    'access_token' => $data['access_token'],
    'refresh_token' => $data['refresh_token'] ?? null,
    'expires_at' => time() + (int)($data['expires_in'] ?? 2592000),
], JSON_PRETTY_PRINT));

echo '✅ Ο λογαριασμός Pinterest συνδέθηκε επιτυχώς! Μπορείς να κλείσεις αυτή την καρτέλα.';
