<?php
/**
 * SmartGarden.gr - What the automation costs to run.
 *
 * Reports the recorded Gemini token usage per article and what it adds up to. The point is
 * not the absolute figure — at current traffic the cost is trivial — it is having the number
 * ready for the moment ad revenue starts arriving and the only question that matters is
 * whether publishing pays for itself.
 *
 * URL: /treasury.php?key=<cron key>
 */

require_once __DIR__ . '/usage-ledger.php';

header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$ledger = json_decode((string) @file_get_contents(sg_usage_path()), true);
if (!is_array($ledger)) $ledger = array();

$price = json_decode(SG_GEMINI_PRICE, true);

$byDate = array();
$totalIn = 0;
$totalOut = 0;
foreach ($ledger as $row) {
    $totalIn += (int) $row['inputTokens'];
    $totalOut += (int) $row['outputTokens'];
    $d = $row['date'];
    if (!isset($byDate[$d])) $byDate[$d] = array('articles' => 0, 'tokens' => 0);
    $byDate[$d]['articles']++;
    $byDate[$d]['tokens'] += (int) $row['totalTokens'];
}
krsort($byDate);

$cost = function ($in, $out) use ($price) {
    return round(($in / 1000000) * $price['input'] + ($out / 1000000) * $price['output'], 4);
};

$articles = count($ledger);
$totalCost = $cost($totalIn, $totalOut);
$perArticle = $articles ? round($totalCost / $articles, 4) : 0;

echo json_encode(array(
    'success' => true,
    'articlesRecorded' => $articles,
    'note' => $articles === 0
        ? 'Δεν έχει καταγραφεί ακόμη χρήση. Η καταγραφή ξεκινά με το επόμενο άρθρο που θα βγάλει ο cron.'
        : null,
    'tokens' => array('input' => $totalIn, 'output' => $totalOut, 'total' => $totalIn + $totalOut),
    'estimatedUsd' => array(
        'total' => $totalCost,
        'perArticle' => $perArticle,
        'perMonthAtOneADay' => round($perArticle * 30, 2),
    ),
    // Said plainly so nobody quotes these as invoiced amounts.
    'pricingCaveat' => 'Εκτίμηση με τιμές Gemini ελεγμένες στις ' . $price['checked']
        . ' ($' . $price['input'] . '/M input, $' . $price['output'] . '/M output). '
        . 'Τα tokens είναι πραγματικά· η τιμή αλλάζει από την Google — έλεγξέ την στο ai.google.dev/pricing.',
    'freeComponents' => array(
        'Αφήγηση (Edge TTS)', 'Φωτογραφίες (Unsplash)', 'Μουσική (YouTube Audio Library)',
        'Απόδοση βίντεο (ffmpeg στον server)', 'Ανέβασμα (YouTube/Pinterest/TikTok APIs)',
    ),
    'byDate' => array_slice($byDate, 0, 30, true),
), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
