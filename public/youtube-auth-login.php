<?php
/**
 * SmartGarden.gr - YouTube OAuth Step 1.
 * Requires YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET (SetEnv in .htaccess, same
 * pattern as Pinterest/TikTok). Create an OAuth 2.0 Client ID (Web application) at
 * console.cloud.google.com > APIs & Services > Credentials, with the YouTube Data
 * API v3 enabled on the project, and redirect URI
 * https://smartgarden.gr/youtube-auth-callback.php
 * URL: https://smartgarden.gr/youtube-auth-login.php
 */

$clientId = getenv('YOUTUBE_CLIENT_ID') ?: '';
$redirectUri = 'https://smartgarden.gr/youtube-auth-callback.php';

if (!$clientId) {
    http_response_code(500);
    echo 'YOUTUBE_CLIENT_ID is not configured yet. Create an OAuth Client ID at console.cloud.google.com first.';
    exit;
}

$state = bin2hex(random_bytes(8));
$params = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    // upload alone is enough to publish, but says nothing about what happened next.
    // yt-analytics.readonly gives retention (average view percentage — the number that
    // showed videos were being abandoned at 17s) and youtube.readonly is what lets us
    // list our own uploads while they are still private.
    'scope' => implode(' ', array(
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
        'https://www.googleapis.com/auth/youtube.readonly',
        // Search Console rides along on the same Google account and the same consent
        // screen, so one approval covers both. Asking twice means a second chance to
        // never get round to it.
        'https://www.googleapis.com/auth/webmasters.readonly',
    )),
    'state' => $state,
    // offline + consent (not just "select_account") is required to actually get a
    // refresh_token back — Google only issues one on the first real consent grant,
    // or every time when prompt=consent is forced like this.
    'access_type' => 'offline',
    'prompt' => 'consent',
]);

header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
exit;
