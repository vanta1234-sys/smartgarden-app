<?php
/**
 * SmartGarden.gr - What each published article actually costs to generate.
 *
 * Gemini returns usageMetadata with every response and it has always been discarded, so
 * nobody could answer "what does an article cost" except by opening the Google billing
 * console and dividing. Recording it per article makes the marginal cost of publishing a
 * real number, which is the only way to tell later whether ad revenue covers it.
 *
 * Tokens are a fact and are recorded as such. The price per token is a moving target set by
 * Google, so it lives in one place below and is reported as an estimate — never presented as
 * an invoice.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/**
 * Price per MILLION tokens, in USD.
 *
 * CHECK THIS against https://ai.google.dev/pricing before trusting any euro figure it
 * produces — Google changes these, and a stale number here turns into a confidently wrong
 * cost report. Token counts stay correct either way.
 */
if (!defined('SG_GEMINI_PRICE')) {
    define('SG_GEMINI_PRICE', json_encode(array(
        'input' => 0.10,
        'output' => 0.40,
        'checked' => '2026-09-16',
    )));
}

function sg_usage_path() {
    return __DIR__ . '/gemini_usage.json';
}

/**
 * Add one article's token usage to the ledger.
 *
 * Takes the raw Gemini response bodies so it can total several calls — an article is
 * generated from two parallel requests, and counting one would halve the answer.
 * Best-effort: bookkeeping must never be able to fail a publish.
 */
function sg_record_usage($rawResponses, $model, $slug) {
    $in = 0;
    $out = 0;
    $total = 0;
    foreach ((array) $rawResponses as $raw) {
        $d = json_decode((string) $raw, true);
        $u = $d['usageMetadata'] ?? null;
        if (!$u) continue;
        $in += (int) ($u['promptTokenCount'] ?? 0);
        $out += (int) ($u['candidatesTokenCount'] ?? 0);
        $total += (int) ($u['totalTokenCount'] ?? 0);
    }
    if ($total === 0 && $in === 0 && $out === 0) return false;

    $ledger = json_decode((string) @file_get_contents(sg_usage_path()), true);
    if (!is_array($ledger)) $ledger = array();

    $ledger[] = array(
        'date' => date('Y-m-d'),
        'slug' => (string) $slug,
        'model' => (string) $model,
        'inputTokens' => $in,
        'outputTokens' => $out,
        'totalTokens' => $total ?: ($in + $out),
    );

    // A year of daily articles is ~365 rows; keeping 500 bounds the file without losing
    // anything anyone would look at.
    if (count($ledger) > 500) $ledger = array_slice($ledger, -500);

    return (bool) @file_put_contents(sg_usage_path(), json_encode($ledger, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
