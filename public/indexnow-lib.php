<?php
/**
 * SmartGarden.gr - IndexNow: a single free ping tells Bing, Yandex and every other
 * participating search engine about a new/changed URL immediately, instead of waiting
 * for their own crawl schedule to notice it. No account, no verification dashboard --
 * just a key file hosted at the site root proving control of the domain.
 *
 * https://www.indexnow.org/documentation
 */

define('SG_INDEXNOW_KEY', 'c864f82901c4502fc5c6ddde4fedbcf5');

/**
 * Submit one or more URLs. Best-effort and silent by design, same as the Pinterest/
 * Facebook/video auto-steps in cron-publish.php: a ping failing must never break
 * anything else in the caller.
 */
function sg_indexnow_submit(array $urls) {
    if (empty($urls)) return array('ok' => false, 'error' => 'no urls');
    $payload = json_encode(array(
        'host' => 'smartgarden.gr',
        'key' => SG_INDEXNOW_KEY,
        'keyLocation' => 'https://smartgarden.gr/' . SG_INDEXNOW_KEY . '.txt',
        'urlList' => array_values($urls),
    ));
    $ch = curl_init('https://api.indexnow.org/indexnow');
    curl_setopt_array($ch, array(
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => array('Content-Type: application/json; charset=utf-8'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ));
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    // IndexNow answers 200 or 202 or both on success depending on engine; treat any 2xx as ok.
    return array('ok' => $code >= 200 && $code < 300, 'httpCode' => $code, 'raw' => $raw);
}
