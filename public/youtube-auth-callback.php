<?php
/**
 * SmartGarden.gr - YouTube OAuth Step 2: exchange code for tokens.
 * URL: https://smartgarden.gr/youtube-auth-callback.php
 */

header('Content-Type: text/html; charset=utf-8');

$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$clientSecret = getenv('YOUTUBE_CLIENT_SECRET') ?: '';
$redirectUri = 'https://smartgarden.gr/youtube-auth-callback.php';

if (!isset($_GET['code'])) {
    http_response_code(400);
    echo 'YouTube authorization failed: ' . htmlspecialchars($_GET['error'] ?? 'no code returned', ENT_QUOTES);
    exit;
}

$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'code' => $_GET['code'],
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code',
    ]),
]);
$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);

if (empty($data['access_token'])) {
    http_response_code(500);
    echo 'YouTube token exchange failed: ' . htmlspecialchars($response, ENT_QUOTES);
    exit;
}

if (empty($data['refresh_token'])) {
    // Happens if this Google account already granted consent before without
    // prompt=consent forcing a fresh one. Preserve any previously stored refresh
    // token rather than overwriting it with nothing.
    $existing = @file_get_contents(__DIR__ . '/youtube_tokens.json');
    $existingData = $existing ? json_decode($existing, true) : null;
    if ($existingData && !empty($existingData['refresh_token'])) {
        $data['refresh_token'] = $existingData['refresh_token'];
    }
}

file_put_contents(__DIR__ . '/youtube_tokens.json', json_encode([
    'access_token' => $data['access_token'],
    'refresh_token' => $data['refresh_token'] ?? null,
    'expires_at' => time() + (int)($data['expires_in'] ?? 3600),
], JSON_PRETTY_PRINT));

if (empty($data['refresh_token'])) {
    echo '⚠️ Συνδέθηκε, αλλά δεν επιστράφηκε refresh token και δεν υπήρχε ήδη αποθηκευμένο. Πήγαινε στο <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>, αφαίρεσε την πρόσβαση του SmartGarden app, και ξαναδοκίμασε το login link από την αρχή.';
} else {
    echo '✅ Ο λογαριασμός YouTube συνδέθηκε επιτυχώς! Μπορείς να κλείσεις αυτή την καρτέλα.';
}
