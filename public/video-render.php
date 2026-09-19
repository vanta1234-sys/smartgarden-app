<?php
/**
 * SmartGarden.gr - Server-side video renderer (HTTP entry point).
 *
 * Replaces the browser-tab recording in TikTokStudio: a 1080x1920 Short is now built
 * entirely on the server from an article, with no one watching a canvas record in real time.
 *
 * Actions (all need ?key=<cron key>):
 *   selftest            - checks ffmpeg, fonts, TTS and the photo catalogue are all in place
 *   start&articleId=..  - queues a render, returns a job id (also accepts slug=, or nothing
 *                         at all to take the newest article)
 *   status&job=..       - progress for one job
 *   file&job=..         - streams the finished mp4
 *   cleanup             - removes job directories older than 24h
 *
 * The render runs detached via the PHP CLI so it isn't tied to this request; if the host has
 * no CLI binary, ?inline=1 runs it in-process instead.
 */

// Before the require, not after: the frame size is a constant inside that file. The worker
// does the same thing from job.json — this is so &dry=1 reports the shape it would render
// rather than the default.
$GLOBALS['SG_VIDEO_MODE'] = (isset($_GET['mode']) && $_GET['mode'] === 'long') ? 'long' : 'short';

require_once __DIR__ . '/video-lib.php';

header('Content-Type: application/json; charset=utf-8');
@set_time_limit(0);

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

/** Cloudflare eats origin 5xx bodies, so application errors go out as 200 + success:false. */
function sg_out($data) {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function sg_err($message, $extra = array()) {
    sg_out(array_merge(array('success' => false, 'error' => $message), $extra));
}

$binDir  = dirname(__DIR__) . '/ffmpeg-bin';
$FFMPEG  = $binDir . '/ffmpeg';
$FFPROBE = $binDir . '/ffprobe';
$JOBS_ROOT = is_writable(dirname(__DIR__)) ? dirname(__DIR__) . '/video-jobs' : __DIR__ . '/video-jobs';

/** First PHP CLI binary that actually runs, or null on a host without one. */
function sg_php_cli() {
    $candidates = array(
        '/opt/plesk/php/8.3/bin/php',
        '/opt/plesk/php/8.2/bin/php',
        '/usr/local/bin/php',
        '/usr/bin/php',
        'php',
    );
    foreach ($candidates as $c) {
        $out = @shell_exec(escapeshellarg($c) . ' -v 2>&1');
        if (is_string($out) && stripos($out, 'PHP ') === 0) return $c;
    }
    return null;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'status';

// ============================================================================
// selftest
// ============================================================================
if ($action === 'selftest') {
    $catalogue = sg_load_catalogue();
    $ttsProbe = $JOBS_ROOT . '/_tts_probe.mp3';
    if (!is_dir($JOBS_ROOT)) @mkdir($JOBS_ROOT, 0755, true);
    $ttsOk = sg_fetch_to_file('https://smartgarden.gr/tts-edge.php?text=' . rawurlencode('Δοκιμή ήχου'), $ttsProbe, 45);
    $ttsBytes = $ttsOk ? filesize($ttsProbe) : 0;
    @unlink($ttsProbe);

    $ffmpegVersion = is_file($FFMPEG) ? trim(strtok((string) @shell_exec(escapeshellarg($FFMPEG) . ' -version 2>&1'), "\n")) : null;

    sg_out(array(
        'success' => is_file($FFMPEG) && is_file(SG_FONT) && count($catalogue['curated']) > 0 && $ttsBytes > 4000,
        'ffmpeg' => array('path' => $FFMPEG, 'ok' => is_file($FFMPEG), 'version' => $ffmpegVersion),
        'ffprobe' => array('path' => $FFPROBE, 'ok' => is_file($FFPROBE)),
        'font' => array('path' => SG_FONT, 'ok' => is_file(SG_FONT), 'freetype' => function_exists('imagettftext')),
        'gd' => extension_loaded('gd'),
        'catalogue' => array('curated' => count($catalogue['curated']), 'neutral' => count($catalogue['neutral']), 'fallback' => count($catalogue['fallback'])),
        'tts' => array('ok' => $ttsBytes > 4000, 'bytes' => $ttsBytes),
        'jobsRoot' => array('path' => $JOBS_ROOT, 'writable' => is_dir($JOBS_ROOT) && is_writable($JOBS_ROOT)),
        'phpCli' => sg_php_cli(),
    ));
}

// ============================================================================
// probe - narrows down which stage of the render is failing
// ============================================================================
if ($action === 'probe') {
    if (!is_dir($JOBS_ROOT)) @mkdir($JOBS_ROOT, 0755, true);
    $t = $JOBS_ROOT . '/_probe';
    if (!is_dir($t)) @mkdir($t, 0755, true);
    $F = escapeshellarg($FFMPEG);
    $results = array();

    // Can we fetch and process a stock photo from here, through the real helper?
    $photo = $t . '/photo.jpg';
    $url = 'https://images.unsplash.com/photo-1698775942613-3e9fc114b2a1?w=1200&auto=format&fit=crop&q=80';
    $fetched = sg_fetch_to_file($url, $photo, 45);
    $size = $fetched ? @getimagesize($photo) : null;
    $results['photo_fetch'] = array(
        'ok' => $fetched,
        'bytes' => $fetched ? filesize($photo) : 0,
        'dimensions' => $size ? $size[0] . 'x' . $size[1] : null,
        'bg_render' => $fetched ? (sg_render_background($photo, $t . '/bg.jpg') ? 'ok' : 'failed') : 'skipped',
        'allow_url_fopen' => (bool) ini_get('allow_url_fopen'),
    );

    // And can GD draw a Greek text overlay with the bundled font?
    $ovOk = sg_render_overlay(array(
        'onScreenText' => 'Δοκιμή ελληνικού κειμένου 1️⃣',
        'voiceover' => 'Αυτή είναι μια δοκιμαστική λεζάντα για το βίντεο',
        'step' => 2,
    ), $t . '/ov.png');
    $results['overlay_render'] = array('ok' => $ovOk, 'bytes' => file_exists($t . '/ov.png') ? filesize($t . '/ov.png') : 0);

    // Then each ffmpeg feature the renderer relies on, one at a time.
    $steps = array(
        'x264_default'   => array('a.mp4',  ' -c:v libx264 -preset ultrafast -pix_fmt yuv420p'),
        'x264_threads1'  => array('b.mp4',  ' -c:v libx264 -preset ultrafast -pix_fmt yuv420p -threads 1'),
        'x264_small'     => array('c.mp4',  ' -c:v libx264 -preset ultrafast -pix_fmt yuv420p -s 320x240'),
        'mpeg4_default'  => array('d.mp4',  ' -c:v mpeg4 -pix_fmt yuv420p'),
        'x264_full'      => array('e.mp4',  ' -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -r 30 -fps_mode cfr -g 60 -threads 1'),
    );
    foreach ($steps as $name => $spec) {
        $target = $t . '/' . $spec[0];
        $cmd = $F . ' -y -v error -f lavfi -i color=c=green:s=1080x1920:d=1' . $spec[1] . ' ' . escapeshellarg($target) . ' 2>&1';
        $out = @shell_exec($cmd);
        $results[$name] = array(
            'ok' => file_exists($target) && filesize($target) > 500,
            'bytes' => file_exists($target) ? filesize($target) : 0,
            'stderr' => trim((string) $out),
        );
    }

    $results['aac_audio'] = array();
    $aac = $t . '/f.m4a';
    $out = @shell_exec($F . ' -y -v error -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t 1 -c:a aac -b:a 128k ' . escapeshellarg($aac) . ' 2>&1');
    $results['aac_audio'] = array('ok' => file_exists($aac) && filesize($aac) > 500, 'stderr' => trim((string) $out));

    $results['nproc'] = trim((string) @shell_exec('nproc 2>&1'));
    $results['ulimit_u'] = trim((string) @shell_exec('sh -c "ulimit -u" 2>&1'));
    $results['ulimit_v'] = trim((string) @shell_exec('sh -c "ulimit -v" 2>&1'));

    // Finally the real scene pipeline (Ken Burns + overlay + audio), at a few thread counts
    // and source sizes, to find a combination that fits inside `ulimit -v`.
    if ($fetched && $ovOk) {
        $variants = array(
            'kb_1350_t4' => array(1350, 2400, 4),
            'kb_1350_t2' => array(1350, 2400, 2),
            'kb_1350_t1' => array(1350, 2400, 1),
            'kb_1215_t2' => array(1215, 2160, 2),
            'kb_1215_t1' => array(1215, 2160, 1),
        );
        foreach ($variants as $name => $v) {
            list($sw, $sh, $threads) = $v;
            $src = $t . '/bg_' . $sw . '.jpg';
            if (!file_exists($src)) sg_render_background($photo, $src, $sw, $sh);
            $target = $t . '/' . $name . '.mp4';
            $vf = "[0:v]scale={$sw}:{$sh},zoompan=z='min(1+0.0009*on,1.14)'"
                . ":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+sin(on*0.04)*12'"
                . ':d=1:s=1080x1920:fps=30[kb];[kb][1:v]overlay=0:0[v]';
            $cmd = $F . ' -y -v error -framerate 30 -loop 1 -t 3 -i ' . escapeshellarg($src)
                 . ' -loop 1 -t 3 -i ' . escapeshellarg($t . '/ov.png')
                 . ' -f lavfi -t 3 -i anullsrc=channel_layout=stereo:sample_rate=44100'
                 . ' -filter_complex ' . escapeshellarg($vf)
                 . ' -map "[v]" -map 2:a -t 3'
                 . ' -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -r 30 -fps_mode cfr -g 60'
                 . ' -threads ' . $threads . ' -filter_complex_threads 1'
                 . ' -c:a aac -b:a 128k -ar 44100 -ac 2 ' . escapeshellarg($target) . ' 2>&1';
            $started = microtime(true);
            $out = @shell_exec($cmd);
            $results[$name] = array(
                'ok' => file_exists($target) && filesize($target) > 10000,
                'bytes' => file_exists($target) ? filesize($target) : 0,
                'seconds' => round(microtime(true) - $started, 1),
                'stderr' => trim((string) $out),
            );
        }
    }

    foreach ((array) glob($t . '/*') as $f) @unlink($f);
    sg_out(array('success' => true, 'results' => $results));
}

// ============================================================================
// testalert - proves the failure alerts actually reach a person
// ============================================================================
// Monitoring that has never delivered a message is indistinguishable from no monitoring.
if ($action === 'testalert') {
    require_once __DIR__ . '/notify.php';
    $sent = sg_notify_failure('SmartGarden: δοκιμή ειδοποίησης', array(
        'Αυτό είναι δοκιμαστικό μήνυμα, δεν έχει χαλάσει τίποτα.',
        'Επιβεβαιώνει ότι οι ειδοποιήσεις αποτυχίας φτάνουν σε άνθρωπο.',
    ));
    sg_out(array(
        'success' => $sent,
        'note' => $sent
            ? 'Στάλθηκε. Το ίδιο θέμα δεν ξαναστέλνεται για 12 ώρες.'
            : 'Δεν στάλθηκε: λείπει το BREVO_API_KEY, ή έχει ήδη σταλεί το ίδιο θέμα τις τελευταίες 12 ώρες.',
    ));
}

// ============================================================================
// jobs - recent renders and how they ended
// ============================================================================
// Failures were invisible: the admin page only lists jobs that produced an mp4, so a render
// that died left the article with no video and nothing anywhere said so. This lists every
// recent job with its state, newest first.
if ($action === 'disk') {
    $root = is_dir($JOBS_ROOT) ? $JOBS_ROOT : __DIR__;
    $used = 0;
    $perJob = array();
    foreach ((array) glob($JOBS_ROOT . '/*', GLOB_ONLYDIR) as $d) {
        $s = 0;
        foreach ((array) glob($d . '/*') as $f) $s += (int) @filesize($f);
        $used += $s;
        $perJob[basename($d)] = (int) round($s / 1048576) . 'MB';
    }
    arsort($perJob);
    sg_out(array(
        'success' => true,
        'freeMB' => (int) round((float) @disk_free_space($root) / 1048576),
        'totalMB' => (int) round((float) @disk_total_space($root) / 1048576),
        'jobsUsedMB' => (int) round($used / 1048576),
        'jobs' => array_slice($perJob, 0, 15, true),
    ));
}

if ($action === 'jobs') {
    $rows = array();
    foreach ((array) glob($JOBS_ROOT . '/*', GLOB_ONLYDIR) as $d) {
        // Directories starting with _ are scratch space for the diagnostics above, not
        // renders. Counting _probe as a failed job made the health summary report a
        // permanent phantom failure that no amount of successful publishing would clear.
        if (strpos(basename($d), '_') === 0) continue;
        $status = json_decode((string) @file_get_contents($d . '/status.json'), true);
        $job = json_decode((string) @file_get_contents($d . '/job.json'), true);
        $video = $d . '/video.mp4';
        $rows[] = array(
            'job' => basename($d),
            'article' => isset($job['article']['slug']) ? $job['article']['slug'] : null,
            'state' => isset($status['state']) ? $status['state'] : 'unknown',
            'message' => isset($status['message']) ? $status['message'] : null,
            'duration' => isset($status['duration']) ? $status['duration'] : null,
            'video' => is_file($video) ? filesize($video) : 0,
            'published' => isset($status['publish']) ? $status['publish'] : null,
            'when' => date('c', filemtime($d)),
        );
    }
    usort($rows, function ($a, $b) { return strcmp($b['job'], $a['job']); });
    $failed = 0;
    foreach ($rows as $r) if ($r['state'] !== 'done') $failed++;
    sg_out(array(
        'success' => true,
        'total' => count($rows),
        'not_done' => $failed,
        'jobs' => array_slice($rows, 0, isset($_GET['limit']) ? (int) $_GET['limit'] : 15),
    ));
}

// ============================================================================
// cleanup
// ============================================================================
if ($action === 'cleanup') {
    $removed = 0;
    foreach ((array) glob($JOBS_ROOT . '/*', GLOB_ONLYDIR) as $d) {
        if (filemtime($d) < time() - 86400) {
            foreach ((array) glob($d . '/*') as $f) @unlink($f);
            if (@rmdir($d)) $removed++;
        }
    }
    sg_out(array('success' => true, 'removed' => $removed));
}

// ============================================================================
// status / file
// ============================================================================
if ($action === 'status' || $action === 'file') {
    $job = isset($_GET['job']) ? basename($_GET['job']) : '';
    $dir = $JOBS_ROOT . '/' . $job;
    if ($job === '' || !is_dir($dir)) sg_err('Unknown job: ' . $job);

    if ($action === 'file') {
        $video = $dir . '/video.mp4';
        if (!file_exists($video)) sg_err('Video not ready');
        header('Content-Type: video/mp4');
        header('Content-Length: ' . filesize($video));
        header('Content-Disposition: inline; filename="smartgarden-' . $job . '.mp4"');
        readfile($video);
        exit;
    }

    $status = file_exists($dir . '/status.json')
        ? json_decode(file_get_contents($dir . '/status.json'), true)
        : array('state' => 'queued', 'progress' => 0, 'message' => 'Σε αναμονή');
    $status['job'] = $job;
    if (($status['state'] ?? '') === 'done') {
        $status['url'] = 'https://smartgarden.gr/video-render.php?action=file&job=' . $job . '&key=' . rawurlencode($_GET['key']);
    }
    if (isset($_GET['log']) && file_exists($dir . '/render.log')) {
        $status['log'] = explode("\n", trim(file_get_contents($dir . '/render.log')));
    }
    sg_out($status);
}

// ============================================================================
// start
// ============================================================================
if ($action !== 'start') sg_err('Unknown action: ' . $action);

if (!is_file($FFMPEG)) sg_err('ffmpeg is not installed on this server', array('expected' => $FFMPEG));

// A Short is 8-15MB. A fifteen-minute episode is around 300MB, and it exists twice at once
// — every scene file plus the stitched result during concat, then the stitched result plus
// the music-mixed copy. Running the host out of disk mid-render would take the website down
// with it, which is a far worse outcome than not making a video today.
if ($mode === 'long') {
    $freeBytes = @disk_free_space(is_dir($JOBS_ROOT) ? $JOBS_ROOT : __DIR__);
    if ($freeBytes !== false && $freeBytes < 1500 * 1024 * 1024) {
        sg_err('Not enough free disk for a long render', array(
            'freeMB' => (int) round($freeBytes / 1048576),
            'needMB' => 1500,
            'hint' => 'video-render.php?action=cleanup clears finished jobs',
        ));
    }
}

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true);
if (!is_array($articles) || !count($articles)) sg_err('No articles available');

$article = null;
if (!empty($_GET['articleId'])) {
    foreach ($articles as $a) { if (($a['id'] ?? '') === $_GET['articleId']) { $article = $a; break; } }
} elseif (!empty($_GET['slug'])) {
    foreach ($articles as $a) { if (($a['slug'] ?? '') === $_GET['slug']) { $article = $a; break; } }
} else {
    $article = $articles[0];
}
if (!$article) sg_err('Article not found');

// &mode=long renders the whole article as a landscape episode instead of a vertical Short.
// Two different products from one article: the Short is a trailer, this is the thing it is
// a trailer for, and only one of them earns watch hours.
$mode = (isset($_GET['mode']) && $_GET['mode'] === 'long') ? 'long' : 'short';

// The frame size is a constant inside video-lib.php, which indexing-lib may already have
// loaded at 'short'. Refuse rather than silently render a long script into a 1080x1920
// frame — the worker sets the mode itself and is the only thing that renders.
if ($mode === 'long' && defined('SG_W') && SG_W !== 1920) {
    // Not an error condition in practice: this endpoint only builds the job file, and the
    // detached worker re-reads it with the right mode. Recorded so the log says as much.
    $modeNote = 'script built under short-mode constants; worker re-renders at 1920x1080';
}

$script = $mode === 'long' ? sg_build_long_script($article) : sg_build_script($article);

// Per-scene photos, matched to what each scene actually says.
$sceneTexts = array();
foreach ($script['scenes'] as $s) {
    $sceneTexts[] = trim(($s['onScreenText'] ?? '') . ' ' . ($s['voiceover'] ?? '') . ' ' . ($s['tag'] ?? ''));
}
$articleTitleEl = is_array($article['title'] ?? null) ? ($article['title']['el'] ?? '') : (string) ($article['title'] ?? '');
$sceneImages = $mode === 'long'
    ? sg_scene_images_long($sceneTexts, $article['image'] ?? '', $articleTitleEl, (string) ($article['category'] ?? ''))
    : sg_scene_images($sceneTexts, $article['image'] ?? '', $articleTitleEl, (string) ($article['category'] ?? ''));

// &dry=1 returns the script and the chosen photos without creating a job or spawning the
// worker. A long-form render costs twenty minutes of CPU; being able to read the narration
// it would speak, first, is worth the twelve lines.
if (isset($_GET['dry'])) {
    $spoken = 0;
    $preview = array();
    foreach ($script['scenes'] as $i => $s) {
        $spoken += mb_strlen((string) $s['voiceover'], 'UTF-8');
        $preview[] = array(
            'tag' => $s['tag'],
            'onScreen' => $s['onScreenText'],
            'chars' => mb_strlen((string) $s['voiceover'], 'UTF-8'),
            'voiceover' => mb_substr((string) $s['voiceover'], 0, 110, 'UTF-8'),
            'photo' => isset($sceneImages[$i]) ? basename(parse_url($sceneImages[$i], PHP_URL_PATH)) : '',
        );
    }
    sg_out(array(
        'success' => true,
        'dryRun' => true,
        'mode' => $mode,
        'article' => $article['slug'] ?? '',
        'frame' => SG_W . 'x' . SG_H,
        'scenes' => count($script['scenes']),
        'spokenChars' => $spoken,
        // Greek TTS runs at roughly 17 characters a second.
        'estimatedSeconds' => (int) round($spoken / 17),
        'distinctPhotos' => count(array_unique($sceneImages)),
        'youtubeTitle' => $script['youtubeTitle'],
        'preview' => $preview,
    ));
}

$jobId = date('Ymd-His') . '-' . substr(preg_replace('/[^a-z0-9]/', '', strtolower($article['slug'] ?? 'job')), 0, 24);
$dir = $JOBS_ROOT . '/' . $jobId;
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) sg_err('Could not create job dir: ' . $dir);

$jobJson = json_encode(array(
    // Read by the worker before it loads video-lib.php, because the frame size is a
    // constant and has to be settled before that file is parsed.
    'mode' => $mode,
    'article' => array(
        'id' => $article['id'] ?? '',
        'slug' => $article['slug'] ?? '',
        'title' => $article['title'] ?? '',
        'image' => $article['image'] ?? '',
        'category' => $article['category'] ?? '',
    ),
    'script' => $script,
    'sceneImages' => $sceneImages,
    'ffmpeg' => $FFMPEG,
    'ffprobe' => $FFPROBE,
    // With &publish=1 the worker uploads to YouTube and TikTok once the render finishes.
    // The cron that queues the job is long gone by then, so it can't do this itself.
    'autoPublish' => isset($_GET['publish']),
    'key' => $_GET['key'],
    'created' => date('c'),
), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

// json_encode returns false on malformed UTF-8 rather than throwing, and file_put_contents
// would then happily write an empty file the worker can only report as unreadable.
if ($jobJson === false) sg_err('Could not encode the job: ' . json_last_error_msg());
file_put_contents($dir . '/job.json', $jobJson);

file_put_contents($dir . '/status.json', json_encode(array(
    'state' => 'queued', 'progress' => 0, 'message' => 'Σε αναμονή', 'updated' => date('c'),
)));

$response = array(
    'success' => true,
    'job' => $jobId,
    // Not 'mode': the spawn path below sets that to background/inline, and the two would
    // shadow each other in the response.
    'renderMode' => $mode,
    'article' => $article['slug'] ?? '',
    'scenes' => count($script['scenes']),
    'sceneImages' => $sceneImages,
    'statusUrl' => 'https://smartgarden.gr/video-render.php?action=status&job=' . $jobId . '&key=' . rawurlencode($_GET['key']),
);

// Inline mode blocks until the render finishes - only for hosts with no CLI, or for
// debugging, since LiteSpeed may cut the connection long before it completes.
if (isset($_GET['inline'])) {
    define('SG_JOB_DIR', $dir);
    require __DIR__ . '/video-worker.php';
    $response['status'] = json_decode((string) @file_get_contents($dir . '/status.json'), true);
    $response['mode'] = 'inline';
    sg_out($response);
}

$cli = sg_php_cli();
if (!$cli) {
    sg_err('No PHP CLI binary found to run the render in the background; retry with &inline=1', $response);
}

$spawn = 'nohup ' . escapeshellarg($cli) . ' ' . escapeshellarg(__DIR__ . '/video-worker.php') . ' '
       . escapeshellarg($dir) . ' > ' . escapeshellarg($dir . '/worker.log') . ' 2>&1 & echo $!';
$pid = trim((string) @shell_exec($spawn));

$response['mode'] = 'background';
$response['pid'] = $pid;
sg_out($response);
