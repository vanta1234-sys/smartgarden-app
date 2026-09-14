<?php
/**
 * SmartGarden.gr - Video render worker.
 *
 * Does the slow half of the pipeline for one job: fetches narration, draws the frames,
 * and drives ffmpeg. Runs either detached from the CLI (normal path, so nothing is tied to
 * an HTTP request that LiteSpeed would time out) or included inline by video-render.php
 * when no PHP CLI binary is available.
 *
 *   CLI:    php video-worker.php /path/to/job/dir
 *   inline: define SG_JOB_DIR, then require this file.
 */

require_once __DIR__ . '/video-lib.php';

if (!defined('SG_JOB_DIR')) {
    if (PHP_SAPI !== 'cli' || !isset($argv[1])) {
        fwrite(STDERR, "Usage: php video-worker.php <job-dir>\n");
        exit(1);
    }
    define('SG_JOB_DIR', $argv[1]);
}

@set_time_limit(0);
@ini_set('memory_limit', '512M');

sg_run_job(SG_JOB_DIR);

// ============================================================================

function sg_status($dir, $state, $progress, $message, $extra = array()) {
    $status = array_merge(array(
        'state' => $state,
        'progress' => $progress,
        'message' => $message,
        'updated' => date('c'),
    ), $extra);
    @file_put_contents($dir . '/status.json', json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $status;
}

function sg_log($dir, $line) {
    @file_put_contents($dir . '/render.log', date('H:i:s') . ' ' . $line . "\n", FILE_APPEND);
}

/** Probe a media file's duration in seconds. */
function sg_duration($ffprobe, $file) {
    $cmd = escapeshellarg($ffprobe) . ' -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '
         . escapeshellarg($file) . ' 2>&1';
    $out = @shell_exec($cmd);
    $val = is_string($out) ? (float) trim($out) : 0.0;
    return $val > 0 ? $val : 0.0;
}

/**
 * Fetch Greek narration for one line.
 *
 * Edge's neural voice first (far better Greek), Google Translate TTS as the backstop.
 * Both are called over HTTP against our own endpoints rather than being included, because
 * both scripts write audio straight to the output buffer and exit.
 */
function sg_fetch_tts($text, $dest, $dir) {
    $clean = trim(str_replace(array('«', '»'), '', $text));
    $edge = 'https://smartgarden.gr/tts-edge.php?voice=el-GR-AthinaNeural&text=' . rawurlencode($clean);
    if (sg_fetch_to_file($edge, $dest, 60) && filesize($dest) > 4000) {
        // A 502 JSON error body would also be "a file"; real MP3 starts with ID3 or a frame sync.
        $head = (string) @file_get_contents($dest, false, null, 0, 3);
        if ($head === 'ID3' || (strlen($head) >= 2 && (ord($head[0]) === 0xFF))) {
            return 'edge';
        }
    }
    sg_log($dir, 'edge TTS failed, falling back to Google for: ' . mb_substr($clean, 0, 40));
    @unlink($dest);
    $google = 'https://smartgarden.gr/tts-greek.php?text=' . rawurlencode(mb_substr($clean, 0, 190));
    if (sg_fetch_to_file($google, $dest, 45) && filesize($dest) > 2000) return 'google';
    return null;
}

function sg_run_job($dir) {
    $jobFile = $dir . '/job.json';
    if (!file_exists($jobFile)) { sg_status($dir, 'error', 0, 'job.json missing'); return; }
    $job = json_decode(file_get_contents($jobFile), true);
    if (!is_array($job)) { sg_status($dir, 'error', 0, 'job.json unreadable'); return; }

    $ffmpeg = $job['ffmpeg'];
    $ffprobe = $job['ffprobe'];
    $scenes = $job['script']['scenes'];
    $images = $job['sceneImages'];
    $n = count($scenes);

    sg_status($dir, 'running', 3, 'Ξεκινά η δημιουργία βίντεο');
    sg_log($dir, 'job start: ' . ($job['article']['slug'] ?? '?') . ' (' . $n . ' scenes)');

    // Each finished job leaves ~15MB behind. Uploads happen minutes after the render, so
    // anything three days old is long since published and only costing disk.
    foreach ((array) glob(dirname($dir) . '/*', GLOB_ONLYDIR) as $old) {
        if ($old === $dir || filemtime($old) > time() - 259200) continue;
        foreach ((array) glob($old . '/*') as $f) @unlink($f);
        @rmdir($old);
    }

    $sceneFiles = array();

    foreach ($scenes as $i => $scene) {
        $base = $dir . '/scene' . $i;
        $pct = 5 + (int) round(($i / max(1, $n)) * 75);
        sg_status($dir, 'running', $pct, 'Σκηνή ' . ($i + 1) . ' από ' . $n);

        // --- background photo -------------------------------------------------
        $photoTmp = $base . '.src';
        $photoUrl = isset($images[$i]) ? $images[$i] : '';
        $bg = $base . '_bg.jpg';
        $haveBg = false;
        // 1296x2304 is 1.2x the final frame, and that 20% margin is exactly the room the
        // crop window has to travel through: 216px across, 384px down.
        if ($photoUrl && sg_fetch_to_file($photoUrl, $photoTmp, 45)) {
            $haveBg = sg_render_background($photoTmp, $bg, 1296, 2304);
            @unlink($photoTmp);
        }
        if (!$haveBg) {
            sg_log($dir, 'scene ' . $i . ': photo failed (' . $photoUrl . '), using plain background');
            $canvas = imagecreatetruecolor(1296, 2304);
            imagefilledrectangle($canvas, 0, 0, 1296, 2304, imagecolorallocate($canvas, 6, 45, 34));
            imagejpeg($canvas, $bg, 92);
            imagedestroy($canvas);
        }

        // --- text overlay -----------------------------------------------------
        $ov = $base . '_ov.png';
        if (!sg_render_overlay($scene, $ov)) {
            sg_status($dir, 'error', $pct, 'Αποτυχία στη δημιουργία των γραφικών (σκηνή ' . ($i + 1) . ')');
            return;
        }

        // --- narration --------------------------------------------------------
        $audio = $base . '.mp3';
        $engine = sg_fetch_tts($scene['voiceover'], $audio, $dir);
        $audioDur = ($engine && file_exists($audio)) ? sg_duration($ffprobe, $audio) : 0.0;
        if ($audioDur <= 0.3) {
            // No usable narration: keep the scene on screen for a readable beat instead of
            // dropping it, and carry on silently rather than failing the whole video.
            sg_log($dir, 'scene ' . $i . ': no narration, using silent 3s');
            @unlink($audio);
            $audio = null;
            $sceneDur = 3.0;
        } else {
            $sceneDur = min(15.0, max(2.0, $audioDur + 0.4));
        }
        sg_log($dir, 'scene ' . $i . ': engine=' . ($engine ?: 'none') . ' audio=' . round($audioDur, 2) . 's dur=' . round($sceneDur, 2) . 's');

        // --- encode the scene -------------------------------------------------
        // The photo gets the camera move; the text overlay is composited on top afterwards
        // so it stays sharp and never drifts out of frame.
        //
        // Memory, not speed, is the binding constraint on this host: ffmpeg gets SIGKILLed
        // (exit 137, no stderr at all) by the OOM killer well before `ulimit -v` reports
        // anything, on a different scene each run.
        //
        // The culprit was zoompan, the only filter that rescales every single frame. The
        // camera move here is a crop window drifting across an oversized still instead, which
        // copies pixels rather than resampling them: no OOM, faster, and actually sharper,
        // since the photo is never scaled a second time. The direction rotates per scene so
        // consecutive scenes don't drift the same way.
        $out = $base . '.mp4';
        $panDirection = $i % 4;
        $buildCmd = function ($moving, $preset) use ($ffmpeg, $sceneDur, $bg, $ov, $audio, $out, $panDirection) {
            // Eased 0..1 progress through the scene, so the drift starts and ends gently.
            $p = '(0.5-0.5*cos(PI*min(t/' . sprintf('%.3f', max(0.1, $sceneDur)) . '\,1)))';
            $mx = '(iw-ow)';
            $my = '(ih-oh)';
            switch ($panDirection) {
                case 0:  $x = $mx . '*' . $p;          $y = $my . '/2'; break;
                case 1:  $x = $mx . '/2';              $y = $my . '*' . $p; break;
                case 2:  $x = $mx . '*(1-' . $p . ')'; $y = $my . '/2'; break;
                default: $x = $mx . '/2';              $y = $my . '*(1-' . $p . ')'; break;
            }
            // eof_action=repeat lets the overlay be a SINGLE decoded frame reused for the
            // whole scene. Looping it as a second timed input (and at 25fps, since -framerate
            // only applied to the first input) made overlay buffer the faster stream while it
            // waited on the slower one — that mismatch, not the filtering, is what the OOM
            // killer kept reacting to.
            $vf = $moving
                ? "[0:v]crop=1080:1920:x='" . $x . "':y='" . $y . "',fps=30[kb];[kb][1:v]overlay=0:0:eof_action=repeat[v]"
                : '[0:v]crop=1080:1920,fps=30[kb];[kb][1:v]overlay=0:0:eof_action=repeat[v]';

            $cmd = escapeshellarg($ffmpeg) . ' -y -hide_banner -loglevel error'
                 . ' -framerate 30 -loop 1 -t ' . sprintf('%.3f', $sceneDur) . ' -i ' . escapeshellarg($bg)
                 . ' -i ' . escapeshellarg($ov);

            if ($audio) {
                $cmd .= ' -i ' . escapeshellarg($audio)
                     . ' -filter_complex ' . escapeshellarg($vf . ';[2:a]aresample=44100,apad[a]')
                     . ' -map "[v]" -map "[a]"';
            } else {
                $cmd .= ' -f lavfi -t ' . sprintf('%.3f', $sceneDur)
                     . ' -i anullsrc=channel_layout=stereo:sample_rate=44100'
                     . ' -filter_complex ' . escapeshellarg($vf)
                     . ' -map "[v]" -map 2:a';
            }

            // CFR output matters beyond tidiness: TikTok rejects the variable-frame-rate
            // files the browser's MediaRecorder produced, with frame_rate_check_failed.
            return $cmd . ' -t ' . sprintf('%.3f', $sceneDur)
                 . ' -c:v libx264 -preset ' . $preset . ' -crf 23 -pix_fmt yuv420p'
                 . ' -r 30 -fps_mode cfr -g 60 -bf 0 -refs 1 -rc-lookahead 10'
                 . ' -threads 1 -filter_complex_threads 1'
                 . ' -c:a aac -b:a 128k -ar 44100 -ac 2'
                 . ' ' . escapeshellarg($out) . ' 2>&1';
        };

        // A failed encode still leaves a partial mp4 behind, so file size alone is not proof:
        // an earlier multi-threaded malloc failure wrote 100KB of a truncated file. Trust the
        // measured duration, the exit code and ffmpeg's own stderr instead.
        //
        // Retries drop the camera move rather than the encoder preset. A still scene is barely
        // noticeable; dropping to ultrafast tripled the bitrate and made that scene visibly
        // different from its neighbours.
        // The OOM kill is intermittent, not deterministic — the same scene encodes fine on a
        // second run — so the first retry repeats the identical settings rather than giving
        // up the camera move for a transient blip.
        $plans = array(
            array(true,  'veryfast'),
            array(true,  'veryfast'),
            array(false, 'veryfast'),
            array(false, 'ultrafast'),
        );
        $attempt = 0;
        $ok = false;
        $res = '';
        $exitCode = -1;
        $outDur = 0.0;
        while ($attempt < count($plans) && !$ok) {
            $thisCmd = $buildCmd($plans[$attempt][0], $plans[$attempt][1]);
            $lines = array();
            @exec($thisCmd, $lines, $exitCode);
            $res = trim(implode("\n", $lines));
            // Exit code plus measured duration, and deliberately NOT a scan of stderr for
            // the word "error": Edge TTS occasionally returns an mp3 with one malformed
            // frame, and ffmpeg logs "Error while decoding" while skipping it and producing
            // a perfectly good full-length scene. A genuinely failed encode always shows up
            // as a non-zero exit or a short file.
            $outDur = file_exists($out) ? sg_duration($ffprobe, $out) : 0.0;
            $ok = ($exitCode === 0 && $outDur >= $sceneDur - 0.35);
            if (!$ok) {
                sg_log($dir, 'scene ' . $i . ' attempt ' . ($attempt + 1) . ' failed: exit=' . $exitCode
                    . ' dur=' . round($outDur, 2) . '/' . round($sceneDur, 2)
                    . ' bg=' . (file_exists($bg) ? filesize($bg) : 'MISSING')
                    . ' ov=' . (file_exists($ov) ? filesize($ov) : 'MISSING')
                    . ' stderr=' . ($res === '' ? '(empty)' : $res));
                @unlink($out);
            }
            $attempt++;
        }

        if (!$ok) {
            sg_status($dir, 'error', $pct, 'Αποτυχία κωδικοποίησης στη σκηνή ' . ($i + 1),
                array('detail' => 'exit=' . $exitCode . ' ' . $res));
            return;
        }
        if ($res !== '') sg_log($dir, 'scene ' . $i . ' ffmpeg: ' . $res);

        $sceneFiles[] = $out;
        @unlink($bg);
        @unlink($ov);
    }

    // --- stitch ---------------------------------------------------------------
    sg_status($dir, 'running', 85, 'Ένωση σκηνών');
    $listFile = $dir . '/concat.txt';
    $lines = '';
    foreach ($sceneFiles as $f) $lines .= "file '" . str_replace("'", "'\\''", $f) . "'\n";
    file_put_contents($listFile, $lines);

    $final = $dir . '/video.mp4';
    $cmd = escapeshellarg($ffmpeg) . ' -y -hide_banner -loglevel error -f concat -safe 0 -i '
         . escapeshellarg($listFile) . ' -c copy -movflags +faststart ' . escapeshellarg($final) . ' 2>&1';
    $res = @shell_exec($cmd);

    if (!file_exists($final) || filesize($final) < 20000) {
        sg_log($dir, 'concat FAILED: ' . trim((string) $res));
        sg_status($dir, 'error', 85, 'Αποτυχία ένωσης των σκηνών', array('detail' => trim((string) $res)));
        return;
    }

    foreach ($sceneFiles as $f) @unlink($f);
    @unlink($listFile);

    $duration = sg_duration($ffprobe, $final);
    sg_log($dir, 'done: ' . filesize($final) . ' bytes, ' . round($duration, 2) . 's');

    $publish = !empty($job['autoPublish']) ? sg_publish($job, $dir, basename($dir)) : null;

    sg_status($dir, 'done', 100, 'Το βίντεο είναι έτοιμο', array(
        'video' => $final,
        'bytes' => filesize($final),
        'duration' => round($duration, 2),
        'scenes' => $n,
        'publish' => $publish,
    ));
}

/** POST a JSON body to one of our own endpoints and decode the reply. */
function sg_post_json($url, $payload, $timeout = 180) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ));
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return array('http' => $status, 'body' => json_decode((string) $body, true) ?: (string) $body, 'curl_error' => $err);
}

/**
 * Hand the finished video to YouTube and TikTok.
 *
 * Runs here rather than back in cron-publish.php because the render takes a couple of
 * minutes and the cron request is long gone by then. Both are best-effort: a failed upload
 * is recorded in the job status and never throws away a video that rendered fine.
 *
 * YouTube gets the job id and reads the file off disk (a 15MB mp4 as base64 JSON would
 * exceed post_max_size); TikTok is handed the job's own file URL, which it fetches itself.
 */
function sg_publish($job, $dir, $jobId) {
    $key = $job['key'];
    $script = $job['script'];
    $article = $job['article'];
    $result = array();

    $yt = sg_post_json('https://smartgarden.gr/youtube-publish.php', array(
        'job' => $jobId,
        'key' => $key,
        'title' => $script['youtubeTitle'],
        'description' => $script['youtubeDescription'],
    ));
    $result['youtube'] = array(
        'ok' => !empty($yt['body']['success']),
        'videoId' => isset($yt['body']['videoId']) ? $yt['body']['videoId'] : null,
        'error' => isset($yt['body']['error']) ? $yt['body']['error'] : null,
    );
    sg_log($dir, 'youtube: ' . json_encode($result['youtube'], JSON_UNESCAPED_UNICODE));

    $tt = sg_post_json('https://smartgarden.gr/tiktok-publish.php', array(
        'videoUrl' => 'https://smartgarden.gr/video-render.php?action=file&job=' . $jobId . '&key=' . rawurlencode($key),
        'caption' => $script['tiktokCaption'],
        'title' => $script['youtubeTitle'],
        'articleId' => $article['id'],
    ));
    $result['tiktok'] = array(
        'ok' => !empty($tt['body']['success']),
        'error' => isset($tt['body']['error']) ? $tt['body']['error'] : null,
    );
    sg_log($dir, 'tiktok: ' . json_encode($result['tiktok'], JSON_UNESCAPED_UNICODE));

    return $result;
}
