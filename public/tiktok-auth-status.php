<?php
/**
 * SmartGarden.gr - Reports whether a TikTok account is currently connected.
 * URL: https://smartgarden.gr/tiktok-auth-status.php
 * URL: https://smartgarden.gr/tiktok-auth-status.php?sandbox=1
 */

header('Content-Type: application/json; charset=utf-8');

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';
$tokensPath = __DIR__ . '/' . ($isSandbox ? 'tiktok_tokens_sandbox.json' : 'tiktok_tokens.json');

if (file_exists($tokensPath)) {
    $tokens = json_decode(file_get_contents($tokensPath), true);
    echo json_encode([
        'connected' => !empty($tokens['access_token']),
        'openId' => $tokens['open_id'] ?? null,
        'mode' => $isSandbox ? 'sandbox' : 'production',
    ]);
} else {
    echo json_encode(['connected' => false, 'mode' => $isSandbox ? 'sandbox' : 'production']);
}
