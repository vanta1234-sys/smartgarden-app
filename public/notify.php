<?php
/**
 * SmartGarden.gr - Tell a human when the automation breaks.
 *
 * On 2026-09-16 the cron published an article, the video render failed, and nothing
 * anywhere said so. It surfaced hours later only because someone asked an unrelated
 * question. Every silent step in this pipeline is a step that can fail unnoticed.
 *
 * Deliberately only on failure. A daily "everything is fine" email gets filtered within a
 * week and then the one that matters gets filtered with it.
 *
 * Sent through Brevo, which already carries the newsletter, so there is no second provider
 * to keep alive. Include this file and call sg_notify_failure().
 */

// Include-only. Nothing here executes on its own, but there is no reason for it to answer
// a browser either.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

if (!defined('SG_NOTIFY_TO')) {
    define('SG_NOTIFY_TO', 'smartgarden68@gmail.com');
}

/**
 * Send an alert. Returns true if Brevo accepted it.
 *
 * Never throws and never blocks the caller: a broken alert must not also break the run it
 * was trying to report on.
 *
 * @param string $subject  One line, already specific — it may be all that gets read.
 * @param array  $lines    Body lines, in plain text.
 */
function sg_notify_failure($subject, array $lines) {
    $key = getenv('BREVO_API_KEY');
    if (!$key) return false;

    // One alert per subject per 12 hours. A cron that fails every run would otherwise send
    // an email every run, and the account would start filing them as spam.
    $stamp = sys_get_temp_dir() . '/sg_notify_' . md5($subject) . '.stamp';
    if (file_exists($stamp) && filemtime($stamp) > time() - 43200) return false;
    @file_put_contents($stamp, '1');

    $body = implode("\n", $lines)
          . "\n\n---\nsmartgarden.gr · αυτόματη ειδοποίηση · " . date('Y-m-d H:i');

    $payload = json_encode(array(
        'sender' => array('name' => 'SmartGarden Monitor', 'email' => SG_NOTIFY_TO),
        'to' => array(array('email' => SG_NOTIFY_TO)),
        'subject' => $subject,
        'textContent' => $body,
    ), JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'Accept: application/json', 'api-key: ' . $key),
        CURLOPT_POSTFIELDS => $payload,
    ));
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $status >= 200 && $status < 300;
}
