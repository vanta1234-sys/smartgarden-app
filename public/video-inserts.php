<?php
/**
 * SmartGarden.gr — drop presentation slides into a finished long-form render.
 *
 * The slides REPLACE the picture for their stretch; the narration underneath keeps
 * playing. Cutting 30 seconds of silent slide into the timeline instead would push
 * everything after it out of sync with what is being said, which is the opposite of the
 * point: a chart belongs on screen exactly while the narration explains it. The video is
 * therefore the same length it was.
 *
 * URL: /video-inserts.php?key=<cron key>&job=<render job>&spec=cover:0:30,numbers:32:30,…
 *      &dry=1     what it would do
 *      &status=1  how the current pass is doing
 *
 * Each spec entry is <slide>:<start seconds>:<duration seconds>, the slide being
 * public/_slides/<slide>.png. Output lands beside the source as video-slides.mp4, served
 * by video-render.php?action=file&variant=slides.
 *
 * Also runs itself from the CLI — that is how the background pass is started:
 *   php video-inserts.php <job> <spec> <key>
 */

@set_time_limit(0);
@ini_set('memory_limit', '512M');

$SG_CLI = (PHP_SAPI === 'cli');
if ($SG_CLI) {
    if (!isset($argv[3])) { fwrite(STDERR, "usage: php video-inserts.php <job> <spec> <key>\n"); exit(1); }
    $_GET = array('job' => $argv[1], 'spec' => $argv[2], 'key' => $argv[3], 'run' => '1');
} else {
    header('Content-Type: application/json; charset=utf-8');
}

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS, true)) {
    if (!$SG_CLI) http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$JOBS_ROOT = is_dir(dirname(__DIR__) . '/video-jobs') ? dirname(__DIR__) . '/video-jobs' : __DIR__ . '/video-jobs';
$FFMPEG = dirname(__DIR__) . '/ffmpeg-bin/ffmpeg';
$FFPROBE = dirname(__DIR__) . '/ffmpeg-bin/ffprobe';
$SLIDES = __DIR__ . '/_slides';

function vi_out($d) {
    echo json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function vi_err($m, $extra = array()) {
    vi_out(array_merge(array('success' => false, 'error' => $m), $extra));
}
function vi_status($file, $state, $message, $extra = array()) {
    @file_put_contents($file, json_encode(array_merge(
        array('state' => $state, 'message' => $message, 'updated' => date('c')), $extra
    ), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$job = isset($_GET['job']) ? basename($_GET['job']) : '';
$dir = $JOBS_ROOT . '/' . $job;
if ($job === '' || !is_dir($dir)) vi_err('Unknown job: ' . $job);

$statusFile = $dir . '/inserts.json';

if (isset($_GET['status'])) {
    $st = file_exists($statusFile) ? json_decode((string) file_get_contents($statusFile), true) : null;
    if (!$st) vi_out(array('success' => true, 'state' => 'none'));
    $out = $dir . '/video-slides.mp4';
    if (file_exists($out)) {
        $st['bytes'] = filesize($out);
        $st['url'] = 'https://smartgarden.gr/video-render.php?action=file&variant=slides&job=' . $job
                   . '&key=' . rawurlencode($_GET['key']);
    }
    vi_out(array_merge(array('success' => true), $st));
}

$src = $dir . '/video.mp4';
if (!file_exists($src)) vi_err('No rendered video for job ' . $job);
if (!is_file($FFMPEG)) vi_err('ffmpeg missing', array('expected' => $FFMPEG));

// ---------------------------------------------------------------- parse the spec
$specRaw = isset($_GET['spec']) ? (string) $_GET['spec'] : '';
if ($specRaw === '') vi_err('spec is required: name:start:duration,…');

$items = array();
foreach (explode(',', $specRaw) as $part) {
    $bits = explode(':', trim($part));
    if (count($bits) !== 3) vi_err('Bad spec entry: ' . $part);
    $name = preg_replace('/[^A-Za-z0-9_-]/', '', $bits[0]);
    $png = $SLIDES . '/' . $name . '.png';
    if (!is_file($png)) vi_err('No such slide: ' . $name . '.png');
    $items[] = array('png' => $png, 'name' => $name, 'start' => (float) $bits[1], 'dur' => (float) $bits[2]);
}
usort($items, function ($a, $b) { return $a['start'] < $b['start'] ? -1 : 1; });

// Overlapping stretches would mean two slides claiming the same frames; the later one
// would paint over the earlier and the first would silently vanish.
for ($i = 1; $i < count($items); $i++) {
    if ($items[$i]['start'] < $items[$i - 1]['start'] + $items[$i - 1]['dur'] - 0.01) {
        vi_err('Overlapping inserts: ' . $items[$i - 1]['name'] . ' and ' . $items[$i]['name']);
    }
}

if (isset($_GET['dry'])) {
    vi_out(array('success' => true, 'dryRun' => true, 'job' => $job, 'inserts' => $items));
}

// ---------------------------------------------------------------- spawn or run
if (!isset($_GET['run'])) {
    // One pass at a time per job. Two of them share a status file, a work directory and an
    // output path, so the second silently corrupts the first's pieces and whichever finishes
    // last wins — which is how a failure reported for piece 9 turned out to belong to a run
    // that had already exited while another was still going. &force=1 overrides, for a run
    // that really is dead.
    $prev = file_exists($statusFile) ? json_decode((string) file_get_contents($statusFile), true) : null;
    if ($prev && in_array($prev['state'] ?? '', array('queued', 'running'), true) && !isset($_GET['force'])) {
        $age = time() - strtotime($prev['updated'] ?? '1970-01-01');
        // Ten minutes without a status write means it died without saying so; below that,
        // assume it is alive and refuse.
        if ($age < 600) {
            vi_err('A pass is already running for this job', array(
                'state' => $prev['state'], 'message' => $prev['message'] ?? '',
                'secondsSinceUpdate' => $age,
                'hint' => 'wait for it, or add &force=1 if you are sure it is dead',
            ));
        }
    }

    // Same probe video-render.php uses, and for the same reason: is_executable() returns
    // false for the Plesk PHP binaries on this host even though they run perfectly well
    // when invoked, so the only reliable test is to ask each one for its version.
    $cli = null;
    foreach (array('/opt/plesk/php/8.3/bin/php', '/opt/plesk/php/8.2/bin/php', '/usr/local/bin/php', '/usr/bin/php', 'php') as $c) {
        $probe = @shell_exec(escapeshellarg($c) . ' -v 2>&1');
        if (is_string($probe) && stripos($probe, 'PHP ') === 0) { $cli = $c; break; }
    }
    if (!$cli) vi_err('No PHP CLI found to run the pass in the background');

    vi_status($statusFile, 'queued', 'Σε αναμονή', array('inserts' => count($items)));

    $cmd = 'nohup ' . escapeshellarg($cli) . ' ' . escapeshellarg(__FILE__)
         . ' ' . escapeshellarg($job) . ' ' . escapeshellarg($specRaw) . ' ' . escapeshellarg($_GET['key'])
         . ' > ' . escapeshellarg($dir . '/inserts.log') . ' 2>&1 & echo $!';
    $pid = trim((string) @shell_exec($cmd));

    vi_out(array(
        'success' => true, 'state' => 'started', 'job' => $job, 'pid' => $pid,
        'inserts' => count($items),
        'statusUrl' => 'https://smartgarden.gr/video-inserts.php?status=1&job=' . $job . '&key=' . rawurlencode($_GET['key']),
    ));
}

// ---------------------------------------------------------------- the encode
//
// Piece by piece, never all at once.
//
// The obvious shape — thirteen inputs and twelve overlay filters in one graph — was tried
// twice and died twice. First with "Error while opening decoder for input stream #5:0:
// Resource temporarily unavailable", the host refusing another thread; then, with every
// input pinned to one thread, silently with no output at all, which on this host means the
// OOM killer. Twelve 1920x1080 frames alive in one filter graph on top of a decode and an
// encode is simply more than it has.
//
// So the video is cut into a strip of pieces instead: each stretch of original, each slide,
// encoded on its own with ONE input and identical settings, concatenated without re-encoding,
// and the original audio laid back over the result untouched. Same total work, a fraction of
// the peak memory, and each piece that fails names itself.
vi_status($statusFile, 'running', 'Μπολιάζονται οι διαφάνειες', array('inserts' => count($items)));

$out = $dir . '/video-slides.mp4';
@unlink($out);

$total = 0.0;
if (is_file($FFPROBE)) {
    $total = (float) trim((string) @shell_exec(escapeshellarg($FFPROBE)
        . ' -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '
        . escapeshellarg($src) . ' 2>&1'));
}
if ($total <= 1) { vi_status($statusFile, 'error', 'Δεν διαβάστηκε η διάρκεια του βίντεο'); exit(1); }

// &overlay=1 keeps the lettering in front and lets the photographs keep changing behind
// it, instead of the slide taking the whole frame for its stretch. A slide then holds from
// the moment its subject is introduced until the next one replaces it, so the screen is
// never without text and the picture underneath never stops moving. The PNGs have to carry
// alpha for this; a slide drawn on an opaque field would simply hide the video.
$overlay = isset($_GET['overlay']) && $_GET['overlay'] !== '0';

// The strip: original, slide, original, slide, … in time order.
$strip = array();
$cursor = 0.0;
foreach ($items as $it) {
    if ($it['start'] > $cursor + 0.05) $strip[] = array('kind' => 'src', 'from' => $cursor, 'to' => $it['start']);
    $strip[] = $overlay
        ? array('kind' => 'over', 'png' => $it['png'], 'name' => $it['name'],
                'from' => $it['start'], 'to' => $it['start'] + $it['dur'], 'dur' => $it['dur'])
        : array('kind' => 'slide', 'png' => $it['png'], 'name' => $it['name'], 'dur' => $it['dur']);
    $cursor = $it['start'] + $it['dur'];
}
if ($cursor < $total - 0.05) $strip[] = array('kind' => 'src', 'from' => $cursor, 'to' => $total);

// One encoder setting string, used by every piece — concat -c copy only joins streams that
// agree on all of it.
$VENC = ' -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 -fps_mode cfr'
      . ' -g 60 -bf 0 -refs 1 -threads 1 -filter_threads 1 -filter_complex_threads 1 -an';

$pieces = array();
$work = $dir . '/inserts-work';
if (!is_dir($work)) @mkdir($work, 0755, true);
foreach ((array) glob($work . '/*') as $f) @unlink($f);

foreach ($strip as $i => $p) {
    vi_status($statusFile, 'running', 'Κομμάτι ' . ($i + 1) . ' από ' . count($strip),
        array('inserts' => count($items), 'piece' => $i + 1, 'pieces' => count($strip)));

    // Dissolve through black at every seam between a slide and the picture: the lettering
    // dims away, then the photograph comes up. A hard cut from a full-frame slide back to a
    // photograph reads as a glitch — the eye has nothing to follow across it.
    //
    // Both sides of a seam fade, and only at a seam: two stretches of original video that
    // happen to sit next to each other are one continuous shot and must not blink.
    $prevIsSlide = $i > 0 && $strip[$i - 1]['kind'] === 'slide';
    $nextIsSlide = isset($strip[$i + 1]) && $strip[$i + 1]['kind'] === 'slide';
    $FADE_IN = 0.55;
    $FADE_OUT = 0.75;

    $dst = $work . '/p' . sprintf('%03d', $i) . '.mp4';
    if ($p['kind'] === 'over') {
        // Two inputs, which is the most this host will carry in one filter graph before
        // libx264 fails to open an encoder. The picture runs untouched underneath — no fade
        // on it, because it is one continuous shot — and only the lettering dissolves in
        // and out on its own alpha at the two moments it changes.
        $len = $p['to'] - $p['from'];
        $ov = '[1:v]format=rgba,fade=t=in:st=0:d=' . sprintf('%.2f', $FADE_IN) . ':alpha=1';
        if ($len > $FADE_IN + $FADE_OUT + 0.3) {
            $ov .= ',fade=t=out:st=' . sprintf('%.2f', $len - $FADE_OUT)
                 . ':d=' . sprintf('%.2f', $FADE_OUT) . ':alpha=1';
        }
        // setpts=PTS-STARTPTS is the whole trick. -ss before -i leaves the background's
        // timestamps starting at $from, while the looped PNG starts at zero, and overlay
        // syncs its two inputs by timestamp — so they never coincided and it held the
        // first video frame for the entire piece. The output was the right length, the
        // audio was right, and the picture was frozen: 41MB instead of 148, and two frames
        // 110 seconds apart identical to the byte. Rebasing the background to zero makes
        // the two streams share a clock. A single input never needed this, which is why
        // replace mode was always fine.
        $fc = '[0:v]scale=1920:1080,setsar=1,setpts=PTS-STARTPTS[bg];' . $ov . '[ov];[bg][ov]overlay=0:0:format=auto';
        $cmd = escapeshellarg($FFMPEG) . ' -y -hide_banner -loglevel error -threads 1'
             . ' -ss ' . sprintf('%.3f', $p['from']) . ' -t ' . sprintf('%.3f', $len)
             . ' -i ' . escapeshellarg($src)
             . ' -loop 1 -framerate 30 -t ' . sprintf('%.3f', $len)
             . ' -i ' . escapeshellarg($p['png'])
             . ' -filter_complex ' . escapeshellarg($fc)
             . $VENC . ' ' . escapeshellarg($dst) . ' 2>&1';
    } elseif ($p['kind'] === 'src') {
        $len = $p['to'] - $p['from'];
        $vf = 'scale=1920:1080,setsar=1';
        // A stretch of video only fades where it meets a slide.
        if ($prevIsSlide) $vf .= ',fade=t=in:st=0:d=' . sprintf('%.2f', $FADE_IN);
        if ($nextIsSlide && $len > $FADE_OUT + 0.3) {
            $vf .= ',fade=t=out:st=' . sprintf('%.2f', $len - $FADE_OUT) . ':d=' . sprintf('%.2f', $FADE_OUT);
        }
        $cmd = escapeshellarg($FFMPEG) . ' -y -hide_banner -loglevel error -threads 1'
             . ' -ss ' . sprintf('%.3f', $p['from']) . ' -t ' . sprintf('%.3f', $len)
             . ' -i ' . escapeshellarg($src)
             . ' -vf ' . escapeshellarg($vf)
             . $VENC . ' ' . escapeshellarg($dst) . ' 2>&1';
    } else {
        // crop, not scale: the slides come out of the PDF at 1921x1080 through rounding, and
        // shaving the stray column costs nothing while resampling would soften the type.
        // A slide always fades at both ends — every one of its edges is a seam.
        $vf = 'crop=1920:1080:0:0,setsar=1,fade=t=in:st=0:d=' . sprintf('%.2f', $FADE_IN);
        if ($p['dur'] > $FADE_IN + $FADE_OUT + 0.3) {
            $vf .= ',fade=t=out:st=' . sprintf('%.2f', $p['dur'] - $FADE_OUT) . ':d=' . sprintf('%.2f', $FADE_OUT);
        }
        $cmd = escapeshellarg($FFMPEG) . ' -y -hide_banner -loglevel error -threads 1'
             . ' -loop 1 -framerate 30 -t ' . sprintf('%.3f', $p['dur'])
             . ' -i ' . escapeshellarg($p['png'])
             . ' -vf ' . escapeshellarg($vf)
             . $VENC . ' ' . escapeshellarg($dst) . ' 2>&1';
    }

    // Retried, because on this host a piece that dies does so intermittently: the renderer
    // learned the same thing scene by scene, where an identical second attempt succeeds
    // almost every time. Without it, one OOM kill three quarters of the way through throws
    // away every piece already encoded — which is exactly what happened on the first run
    // with fades, at piece 17 of 35.
    $attempt = 0;
    $ok = false;
    $res = '';
    $exit = -1;
    while ($attempt < 3 && !$ok) {
        $lines = array();
        @exec($cmd, $lines, $exit);
        $res = trim(implode("\n", $lines));
        $ok = ($exit === 0 && file_exists($dst) && filesize($dst) > 2000);
        if (!$ok) {
            @unlink($dst);
            // A moment for whatever was holding the memory to let go of it.
            if ($attempt < 2) sleep(4);
        }
        $attempt++;
    }

    if (!$ok) {
        vi_status($statusFile, 'error', 'Απέτυχε το κομμάτι ' . ($i + 1) . ' (' . $p['kind'] . ') μετά από 3 προσπάθειες', array(
            'exit' => $exit,
            'ffmpeg' => $res === '' ? '(καμία έξοδος — πιθανό OOM kill)' : mb_substr($res, 0, 600, 'UTF-8'),
        ));
        exit(1);
    }
    $pieces[] = $dst;
}

// Join, then put the untouched original audio back over it.
vi_status($statusFile, 'running', 'Ένωση και ήχος', array('inserts' => count($items)));

$listFile = $work . '/concat.txt';
$listBody = '';
foreach ($pieces as $f) $listBody .= "file '" . str_replace("'", "'\\''", $f) . "'\n";
file_put_contents($listFile, $listBody);

$silent = $work . '/joined.mp4';
$cmd = escapeshellarg($FFMPEG) . ' -y -hide_banner -loglevel error -threads 1 -f concat -safe 0 -i '
     . escapeshellarg($listFile) . ' -c copy ' . escapeshellarg($silent) . ' 2>&1';
$lines = array(); $exit = -1;
@exec($cmd, $lines, $exit);
if ($exit !== 0 || !file_exists($silent)) {
    vi_status($statusFile, 'error', 'Απέτυχε η ένωση των κομματιών',
        array('exit' => $exit, 'ffmpeg' => mb_substr(trim(implode("\n", $lines)), 0, 600, 'UTF-8')));
    exit(1);
}

$cmd = escapeshellarg($FFMPEG) . ' -y -hide_banner -loglevel error -threads 1'
     . ' -i ' . escapeshellarg($silent) . ' -i ' . escapeshellarg($src)
     . ' -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart '
     . escapeshellarg($out) . ' 2>&1';
$lines = array(); $exit = -1;
@exec($cmd, $lines, $exit);
$res = trim(implode("\n", $lines));

$dur = 0.0;
if (file_exists($out) && is_file($FFPROBE)) {
    $probe = @shell_exec(escapeshellarg($FFPROBE) . ' -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '
        . escapeshellarg($out) . ' 2>&1');
    $dur = (float) trim((string) $probe);
}

if ($exit === 0 && $dur > 1) {
    // The strip pieces plus the joined silent copy are another whole video on disk; the
    // finished file no longer needs them.
    foreach ((array) glob($work . '/*') as $f) @unlink($f);
    @rmdir($work);
    vi_status($statusFile, 'done', 'Έτοιμο', array(
        'inserts' => count($items), 'duration' => round($dur, 2), 'bytes' => filesize($out),
    ));
} else {
    @unlink($out);
    // The success path cleared the work directory and the failure path did not, so every
    // run that OOM-ed left thirty-odd encoded pieces on disk permanently — on an account
    // with 1 GB in total. A failed pass has nothing worth keeping either: the ffmpeg output
    // is in the status file below, and the pieces are reproducible.
    $freed = 0;
    foreach ((array) glob($work . '/*') as $f) { $freed += (int) @filesize($f); @unlink($f); }
    @rmdir($work);
    vi_status($statusFile, 'error', 'Απέτυχε το μπόλιασμα', array(
        'exit' => $exit,
        'freedMB' => (int) round($freed / 1048576),
        'ffmpeg' => $res === '' ? '(καμία έξοδος — πιθανό OOM kill)' : mb_substr($res, 0, 800, 'UTF-8'),
    ));
}
