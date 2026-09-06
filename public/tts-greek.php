<?php
/**
 * SmartGarden.gr - Greek TTS proxy (Google Translate's public TTS endpoint).
 * GET /tts-greek.php?text=... -> raw audio/mpeg bytes, ready for fetch() + decodeAudioData().
 * Same underlying engine as server.ts's generateGreekStudioAudio() (Node dev-only equivalent),
 * ported to PHP since production is static PHP hosting with no live Node server.
 */

$text = isset($_GET['text']) ? trim($_GET['text']) : '';
if ($text === '') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('error' => 'Missing text parameter'));
    exit;
}

// Google Translate TTS caps requests at ~200 chars; split long voiceover lines on
// sentence/clause boundaries so each request stays under that limit.
function chunkGreekTtsText($text, $maxLen = 180) {
    $text = trim($text);
    if (mb_strlen($text, 'UTF-8') <= $maxLen) {
        return array($text);
    }
    $parts = preg_split('/(?<=[.!;\?])\s+/u', $text);
    $chunks = array();
    $current = '';
    foreach ($parts as $part) {
        $candidate = $current === '' ? $part : $current . ' ' . $part;
        if (mb_strlen($candidate, 'UTF-8') > $maxLen && $current !== '') {
            $chunks[] = $current;
            $current = $part;
        } else {
            $current = $candidate;
        }
    }
    if ($current !== '') {
        $chunks[] = $current;
    }
    return $chunks;
}

$chunks = chunkGreekTtsText($text);
$audio = '';
foreach ($chunks as $chunk) {
    $url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' . urlencode($chunk) . '&tl=el&client=tw-ob';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer: https://translate.google.com/',
    ));
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || empty($result)) {
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('error' => 'TTS engine error', 'httpCode' => $httpCode));
        exit;
    }
    $audio .= $result;
}

header('Content-Type: audio/mpeg');
header('Cache-Control: public, max-age=86400');
header('Content-Length: ' . strlen($audio));
echo $audio;
