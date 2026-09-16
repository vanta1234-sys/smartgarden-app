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

// Alerts go to the owner's personal inbox, not the site's. smartgarden68@gmail.com is the
// address the site itself uses for newsletters and platform correspondence, so a monitoring
// email lands there among dozens of others and gets skimmed past — which defeats the point.
// Override with SetEnv SG_NOTIFY_TO in .htaccess to change it without touching code.
if (!defined('SG_NOTIFY_TO')) {
    define('SG_NOTIFY_TO', getenv('SG_NOTIFY_TO') ?: 'vanta1234@gmail.com');
}
// The From address stays the site's: Brevo is configured to send as that domain, and a
// personal address in the sender is more likely to be filtered.
if (!defined('SG_NOTIFY_FROM')) {
    define('SG_NOTIFY_FROM', 'smartgarden68@gmail.com');
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
        'sender' => array('name' => 'SmartGarden Monitor', 'email' => SG_NOTIFY_FROM),
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

/**
 * Did yesterday's article actually get a video?
 *
 * The render is detached and long outlives the request that queued it, so the only honest
 * time to ask is the following day, by which point it has either produced an mp4 or never
 * will. Returns a small report and sends an alert when something is wrong.
 *
 * Lives here rather than inline in the cron so it can also be run on demand — a check that
 * can only run during a publish cannot be tested without publishing.
 */
function sg_check_previous_day(array $articles, $jobsRoot, $cronKey, $notify = true) {
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $prev = null;
    foreach ($articles as $a) {
        if (($a['date'] ?? '') === $yesterday) { $prev = $a; break; }
    }
    if (!$prev) {
        return array('checked' => $yesterday, 'result' => 'no-article', 'note' => 'Δεν βρέθηκε χθεσινό άρθρο.');
    }

    $slugKey = preg_replace('/[^a-z0-9]/', '', strtolower($prev['slug'] ?? ''));
    $found = null;
    foreach ((array) glob($jobsRoot . '/*', GLOB_ONLYDIR) as $d) {
        if ($slugKey !== '' && strpos(basename($d), substr($slugKey, 0, 24)) !== false) {
            $st = json_decode((string) @file_get_contents($d . '/status.json'), true);
            // Keep looking: an early failed attempt must not mask a later success.
            if (!$found || ($st['state'] ?? '') === 'done') $found = $st;
        }
    }

    if (!$found) {
        if ($notify) {
            sg_notify_failure('SmartGarden: χθεσινό άρθρο χωρίς βίντεο', array(
                'Το χθεσινό άρθρο δημοσιεύτηκε αλλά δεν βρέθηκε καμία εργασία βίντεο γι’ αυτό.',
                '', 'Άρθρο: ' . ($prev['slug'] ?? '?'),
                'Πιθανή αιτία: το video-render.php δεν κλήθηκε ή δεν ξεκίνησε.',
                '', 'https://smartgarden.gr/video-render.php?action=jobs&key=' . rawurlencode($cronKey),
            ));
        }
        return array('checked' => $yesterday, 'slug' => $prev['slug'], 'result' => 'no-video-job', 'alerted' => $notify);
    }

    if (($found['state'] ?? '') !== 'done') {
        if ($notify) {
            sg_notify_failure('SmartGarden: χθεσινό βίντεο απέτυχε', array(
                'Το χθεσινό άρθρο δημοσιεύτηκε αλλά το βίντεο δεν ολοκληρώθηκε.',
                '', 'Άρθρο:     ' . ($prev['slug'] ?? '?'),
                'Κατάσταση: ' . ($found['state'] ?? '?'),
                'Μήνυμα:    ' . ($found['message'] ?? '-'),
            ));
        }
        return array('checked' => $yesterday, 'slug' => $prev['slug'], 'result' => 'video-failed',
                     'state' => $found['state'] ?? '?', 'alerted' => $notify);
    }

    return array('checked' => $yesterday, 'slug' => $prev['slug'], 'result' => 'ok',
                 'duration' => $found['duration'] ?? null,
                 'youtube' => $found['publish']['youtube']['ok'] ?? null);
}
