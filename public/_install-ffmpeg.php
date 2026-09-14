<?php
/**
 * SmartGarden.gr - One-time installer for a static ffmpeg binary.
 *
 * Pulls prebuilt static Linux x86_64 ffmpeg/ffprobe binaries straight to the server
 * (server-to-server, so no 80MB FTP upload each deploy) and drops them OUTSIDE the
 * web root.
 *
 * Source is the GitHub release that backs the `ffmpeg-static` npm package. Those assets
 * are plain uncompressed ELF binaries, which matters here: this host has tar but no xz,
 * no python3 and no 7z, so the usual .tar.xz static builds can't be unpacked.
 *
 * Everything is hardcoded on purpose - no part of the URL, path or command comes from the
 * request, so this can't be pointed at anything other than the one install it exists for.
 * Key-gated, and neutralised once ffmpeg is in place.
 */

header('Content-Type: application/json; charset=utf-8');
@set_time_limit(0);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$RELEASE = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/';

// Outside /httpdocs so the binaries aren't web-servable; fall back inside if the parent
// directory isn't writable on this hosting layout.
$preferred = dirname(__DIR__) . '/ffmpeg-bin';
$fallback  = __DIR__ . '/ffmpeg-bin';
$targetDir = is_writable(dirname(__DIR__)) ? $preferred : $fallback;

if (!is_dir($targetDir) && !@mkdir($targetDir, 0755, true)) {
    echo json_encode(array('success' => false, 'error' => 'Could not create ' . $targetDir));
    exit;
}

// Sweep away anything left behind by the earlier .tar.xz attempt.
foreach (array('ffmpeg.tar.xz', 'ffmpeg.tar') as $junk) {
    if (file_exists($targetDir . '/' . $junk)) @unlink($targetDir . '/' . $junk);
}

$steps = array();

/** Download one release asset and verify it really is a 64-bit ELF executable. */
function installBinary($url, $dest, &$steps, $force) {
    if (file_exists($dest) && filesize($dest) > 1000000 && !$force) {
        $steps[] = basename($dest) . ': already present (' . filesize($dest) . ' bytes)';
        return true;
    }
    $tmp = $dest . '.part';
    $fp = @fopen($tmp, 'w');
    if (!$fp) { $steps[] = basename($dest) . ': cannot write to ' . $tmp; return false; }

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_FILE => $fp,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 900,
        CURLOPT_USERAGENT => 'smartgarden-installer',
    ));
    $ok = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    fclose($fp);

    if (!$ok || $status >= 400) {
        $steps[] = basename($dest) . ': download failed (http ' . $status . ') ' . $err;
        @unlink($tmp);
        return false;
    }

    // The assets are raw ELF64 binaries; anything else means we got an error page.
    $magic = (string) @file_get_contents($tmp, false, null, 0, 5);
    if ($magic !== "\x7fELF\x02") {
        $steps[] = basename($dest) . ': not an ELF64 binary (got ' . bin2hex($magic) . ')';
        @unlink($tmp);
        return false;
    }

    if (!@rename($tmp, $dest)) { $steps[] = basename($dest) . ': could not move into place'; return false; }
    @chmod($dest, 0755);
    $steps[] = basename($dest) . ': installed, ' . filesize($dest) . ' bytes';
    return true;
}

$force    = isset($_GET['force']);
$binPath  = $targetDir . '/ffmpeg';
$probePath = $targetDir . '/ffprobe';

$gotFfmpeg  = installBinary($RELEASE . 'ffmpeg-linux-x64',  $binPath,   $steps, $force);
$gotFfprobe = installBinary($RELEASE . 'ffprobe-linux-x64', $probePath, $steps, $force);

$version = $gotFfmpeg ? @shell_exec(escapeshellarg($binPath) . ' -version 2>&1') : null;
$probeVersion = $gotFfprobe ? @shell_exec(escapeshellarg($probePath) . ' -version 2>&1') : null;

// Confirm the codecs the pipeline actually needs are compiled in.
$encoders = $gotFfmpeg ? (string) @shell_exec(escapeshellarg($binPath) . ' -hide_banner -encoders 2>&1') : '';
$codecs = array(
    'libx264' => strpos($encoders, 'libx264') !== false,
    'aac'     => preg_match('/\baac\b/', $encoders) === 1,
);

echo json_encode(array(
    'success'  => $version && strpos((string) $version, 'ffmpeg version') !== false,
    'dir'      => $targetDir,
    'ffmpeg'   => array(
        'path' => $binPath,
        'size' => file_exists($binPath) ? filesize($binPath) : 0,
        'version' => $version ? trim(strtok($version, "\n")) : null,
    ),
    'ffprobe'  => array(
        'path' => file_exists($probePath) ? $probePath : null,
        'size' => file_exists($probePath) ? filesize($probePath) : 0,
        'version' => $probeVersion ? trim(strtok($probeVersion, "\n")) : null,
    ),
    'encoders' => $codecs,
    'steps'    => $steps,
), JSON_PRETTY_PRINT);
