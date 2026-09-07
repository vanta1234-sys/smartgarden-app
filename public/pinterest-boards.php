<?php
/** Lists the connected Pinterest account's boards (to find a boardId for publishing). */
header('Content-Type: application/json; charset=utf-8');
$tokensPath = __DIR__ . '/pinterest_tokens.json';
if (!file_exists($tokensPath)) { http_response_code(401); echo json_encode(['connected'=>false]); exit; }
$tokens = json_decode(file_get_contents($tokensPath), true);
$ch = curl_init('https://api.pinterest.com/v5/boards');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$tokens['access_token']]]);
$resp = curl_exec($ch); curl_close($ch);
echo $resp;
