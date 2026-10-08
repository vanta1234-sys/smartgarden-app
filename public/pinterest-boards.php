<?php
/** Lists the connected Pinterest account's boards (to find a boardId for publishing). */
header('Content-Type: application/json; charset=utf-8');
// Same cron-key gate as the other Pinterest endpoints. This one used to answer anyone, using
// the stored access token (only public board data came back, but it was an open door to the
// Pinterest API on our credentials).
$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$providedKey = isset($_GET['key']) ? $_GET['key'] : '';
if (!in_array($providedKey, $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}
$tokensPath = __DIR__ . '/pinterest_tokens.json';
if (!file_exists($tokensPath)) { http_response_code(401); echo json_encode(['connected'=>false]); exit; }
$tokens = json_decode(file_get_contents($tokensPath), true);
$ch = curl_init('https://api.pinterest.com/v5/boards');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$tokens['access_token']]]);
$resp = curl_exec($ch); curl_close($ch);
echo $resp;
