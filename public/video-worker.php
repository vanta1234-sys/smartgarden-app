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

if (!defined('SG_JOB_DIR')) {
    if (PHP_SAPI !== 'cli' || !isset($argv[1])) {
        fwrite(STDERR, "Usage: php video-worker.php <job-dir>\n");
        exit(1);
    }
    define('SG_JOB_DIR', $argv[1]);
}

// The frame size is a constant in video-lib.php, so the job has to be peeked at before that
// file is parsed. Reading it twice costs nothing and keeps the mode in one place.
$sgPeek = @json_decode((string) @file_get_contents(SG_JOB_DIR . '/job.json'), true);
$GLOBALS['SG_VIDEO_MODE'] = (is_array($sgPeek) && ($sgPeek['mode'] ?? '') === 'long') ? 'long' : 'short';

require_once __DIR__ . '/video-lib.php';
require_once __DIR__ . '/notify.php';

@set_time_limit(0);
// Back to 512M for both. Raising long form to 768M was speculative headroom it never
// needed — the scene loop handles one scene at a time and the bytes live on disk — and
// PHP's allocator does not hand freed chunks back to the OS, so the only real effect was
// to let this process sit on memory that the ffmpeg it spawns is then killed for wanting.
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
function sg_fetch_tts($text, $dest, $dir, &$words = null) {
    $words = array();
    $clean = trim(str_replace(array('«', '»'), '', $text));

    // meta=1 returns the audio together with the time each word is spoken. Both have to
    // come from the same synthesis: asking twice would give timings for different audio.
    $edgeMeta = 'https://smartgarden.gr/tts-edge.php?meta=1&voice=el-GR-AthinaNeural&text=' . rawurlencode($clean);
    $metaFile = $dest . '.json';
    if (sg_fetch_to_file($edgeMeta, $metaFile, 60)) {
        $decoded = json_decode((string) @file_get_contents($metaFile), true);
        @unlink($metaFile);
        if (!empty($decoded['audioBase64'])) {
            $bytes = base64_decode($decoded['audioBase64']);
            if ($bytes !== false && strlen($bytes) > 4000 && @file_put_contents($dest, $bytes)) {
                $words = isset($decoded['words']) ? $decoded['words'] : array();
                return 'edge';
            }
        }
    }
    @unlink($metaFile);

    // Plain audio, no timings — captions fall back to the static headline for this scene.
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

    // "~15MB behind" was written for a twenty-second Short. A long-form render leaves a
    // few hundred, and at three days' retention that is more than the entire 1 GB account.
    // Six hours is still far longer than the minutes an upload needs, and the delete now
    // descends into subdirectories, which the old glob+rmdir pair never did.
    foreach ((array) glob(dirname($dir) . '/*', GLOB_ONLYDIR) as $old) {
        if ($old === $dir || filemtime($old) > time() - 21600) continue;
        sg_rmtree($old);
    }

    $sceneFiles = array();
    // Chapter marks for long form. YouTube builds a chapter list out of timestamps in the
    // description — first one at 0:00, at least three of them, none shorter than ten
    // seconds — and on a fifteen-minute video they are the difference between a viewer
    // who bounces because they cannot find the part they came for and one who jumps to it.
    // Only the render knows where the sections land, because only the render knows how long
    // each piece of narration turned out to be.
    $chapters = array();
    $elapsed = 0.0;
    $lastChapter = null;

    foreach ($scenes as $i => $scene) {
        $base = $dir . '/scene' . $i;
        $pct = 5 + (int) round(($i / max(1, $n)) * 75);
        sg_status($dir, 'running', $pct, 'Σκηνή ' . ($i + 1) . ' από ' . $n);

        // --- background photo -------------------------------------------------
        $photoTmp = $base . '.src';
        $photoUrl = isset($images[$i]) ? $images[$i] : '';
        $bg = $base . '_bg.jpg';
        $haveBg = false;
        // 1.2x the final frame in both directions, and that 20% margin is exactly the room
        // the crop window has to travel through as the camera drifts.
        $srcW = (int) round(SG_W * 1.2);
        $srcH = (int) round(SG_H * 1.2);
        if ($photoUrl && sg_fetch_to_file($photoUrl, $photoTmp, 45)) {
            $haveBg = sg_render_background($photoTmp, $bg, $srcW, $srcH);
            @unlink($photoTmp);
        }
        if (!$haveBg) {
            sg_log($dir, 'scene ' . $i . ': photo failed (' . $photoUrl . '), using plain background');
            $canvas = imagecreatetruecolor($srcW, $srcH);
            imagefilledrectangle($canvas, 0, 0, $srcW, $srcH, imagecolorallocate($canvas, 6, 45, 34));
            imagejpeg($canvas, $bg, 92);
            imagedestroy($canvas);
        }

        // --- narration --------------------------------------------------------
        // Fetched before the overlay is drawn, because whether we got word timings decides
        // whether the overlay should leave room for them.
        $audio = $base . '.mp3';
        $sceneWords = array();
        $engine = sg_fetch_tts($scene['voiceover'], $audio, $dir, $sceneWords);

        // The CTA keeps its static caption: its narration says "Σμαρτ Γκάρντεν" phonetically
        // so the voice gets the brand right, and those words must never reach the screen.
        // Never in long form: forty scenes of per-word drawtext is a filter graph with
        // thousands of entries, on the host that OOM-kills ffmpeg for far less.
        $useWords = !SG_LONG && count($sceneWords) > 0 && empty($scene['captionDisplay']);
        $scene['wordMode'] = $useWords;

        // --- text overlay -----------------------------------------------------
        $ov = $base . '_ov.png';
        if (!sg_render_overlay($scene, $ov)) {
            sg_status($dir, 'error', $pct, 'Αποτυχία στη δημιουργία των γραφικών (σκηνή ' . ($i + 1) . ')');
            return;
        }
        $audioDur = ($engine && file_exists($audio)) ? sg_duration($ffprobe, $audio) : 0.0;
        if ($audioDur <= 0.3) {
            // No usable narration: keep the scene on screen for a readable beat instead of
            // dropping it, and carry on silently rather than failing the whole video.
            sg_log($dir, 'scene ' . $i . ': no narration, using silent 3s');
            @unlink($audio);
            $audio = null;
            $sceneDur = 3.0;
        } else {
            // Tail padding trimmed from 0.4s to 0.22s and the ceiling from 15s to 6s: six
            // scenes at 0.4s of dead air each was nearly 2.5s of the budget doing nothing.
            //
            // The 6s ceiling is a Shorts rule and would be a bug in long form, where a
            // scene carries a 420-character paragraph — about 25 seconds of speech. Capping
            // it there would cut the narration off mid-sentence forty times over.
            $cap = SG_LONG ? 40.0 : 6.0;
            $tail = SG_LONG ? 0.45 : 0.22;
            $sceneDur = min($cap, max(1.6, $audioDur + $tail));
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

        // --- word-by-word caption track ---------------------------------------
        // Each spoken word is its own drawtext, switched on at the moment Edge says it is
        // spoken and left up for the rest of the scene, with the word currently being said
        // picked out in green. Text goes through textfile= rather than text=: Greek copy is
        // full of characters drawtext treats as syntax, and one stray colon would break the
        // whole filter graph.
        $wordChain = 'null';
        if ($useWords) {
            $size = 52;
            $lineHeight = 68;
            $layout = sg_layout_words($sceneWords, $size, SG_W - 150, SG_W / 2, 0, $lineHeight);
            if (count($layout)) {
                $lines = sg_count_word_lines($layout);
                // Centre the block on the same band the static headline used.
                $offsetY = 900 - (int) (($lines - 1) * $lineHeight / 2) - $size;
                $parts = array();
                foreach ($layout as $k => $wd) {
                    $txtFile = $base . '_w' . $k . '.txt';
                    file_put_contents($txtFile, $wd['text']);
                    // y is the top of the glyph box, and that box is measured from the
                    // glyphs actually in the word — so "το", which has neither ascender nor
                    // descender, sat visibly higher than "πέφτει" next to it and the line
                    // came out looking scattered. drawtext exposes `ascent` for the same
                    // rendered glyphs, so subtracting it pins every word to one baseline.
                    $baseline = $wd['y'] + $offsetY + $size;
                    $common = 'fontfile=' . SG_FONT . ':textfile=' . $txtFile
                            . ':x=' . $wd['x'] . ":y='" . $baseline . "-ascent'"
                            . ':fontsize=' . $size . ':borderw=6:bordercolor=black@0.85';
                    $start = sprintf('%.3f', max(0, $wd['start']));
                    $end = sprintf('%.3f', max(0.05, $wd['end']));
                    $parts[] = 'drawtext=' . $common . ":fontcolor=white:enable='gte(t\," . $start . ")'";
                    $parts[] = 'drawtext=' . $common . ":fontcolor=0x6EE7A8:enable='between(t\," . $start . '\,' . $end . ")'";
                }
                $wordChain = implode(',', $parts);
            }
        }

        $buildCmd = function ($moving, $preset) use ($ffmpeg, $sceneDur, $bg, $ov, $audio, $out, $panDirection, $wordChain) {
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
            // Scenes used to butt straight up against each other. A short dip through black
            // at each edge reads as a deliberate beat instead of a jump cut, and because it
            // happens inside the scene's own encode it costs nothing extra and still lets the
            // final stitch run with -c copy.
            $fadeV = 0.18;
            $outV = max(0.0, $sceneDur - $fadeV);

            // The caption fades up and settles from 18px low, rather than appearing all at
            // once fully formed. Slightly after the picture, so the eye lands on the photo
            // first. Needs the overlay as a real 30fps stream: a single repeated frame has
            // nothing for a time-based fade to act on. Matching -framerate on BOTH inputs is
            // what matters — the earlier OOM kills came from looping this at 25fps against a
            // 30fps picture, which made overlay buffer one stream while waiting on the other.
            $fadeT = 0.42;
            $outT = max(0.0, $sceneDur - 0.24);
            $rise = "'18-18*min(t/" . sprintf('%.2f', $fadeT) . "\,1)'";

            $pic = $moving
                ? '[0:v]crop=' . SG_W . ':' . SG_H . ":x='" . $x . "':y='" . $y . "',fps=30"
                : '[0:v]crop=' . SG_W . ':' . SG_H . ',fps=30';
            $pic .= ',fade=t=in:st=0:d=' . sprintf('%.2f', $fadeV)
                  . ',fade=t=out:st=' . sprintf('%.2f', $outV) . ':d=' . sprintf('%.2f', $fadeV) . '[kb]';

            // The overlay is fed as ONE frame in long form, not as a looped 30fps stream.
            //
            // Both inputs looping at 30fps means a twenty-second scene generates 600 frames
            // of picture and 600 of caption, and ffmpeg buffers them to keep the overlay
            // filter fed. Measured across the first long render: scenes under 10s failed
            // their first encode half the time, 10-15s two thirds, and every single scene
            // over 15s was SIGKILLed by the OOM killer — 41 of 47 needed a second attempt,
            // which is why it took seventy minutes rather than thirty-five. The Shorts path
            // never showed it because its scenes are capped at six seconds.
            //
            // eof_action=repeat holds that single frame for the rest of the scene. The cost
            // is the caption's own fade, which a static lower third does not need; the
            // picture still fades at both edges.
            if (SG_LONG) {
                $txt = '[1:v]format=rgba[ov]';
                $vf = $pic . ';' . $txt . ';[kb][ov]overlay=0:0:eof_action=repeat[v]';
            } else {
                $txt = '[1:v]format=rgba,fade=t=in:st=0.10:d=' . sprintf('%.2f', $fadeT) . ':alpha=1'
                     . ',fade=t=out:st=' . sprintf('%.2f', $outT) . ':d=0.24:alpha=1[ov]';
                $vf = $pic . ';' . $txt . ';[kb][ov]overlay=0:' . $rise . '[base];[base]' . $wordChain . '[v]';
            }

            $ovInput = SG_LONG
                ? ' -i ' . escapeshellarg($ov)
                : ' -framerate 30 -loop 1 -t ' . sprintf('%.3f', $sceneDur) . ' -i ' . escapeshellarg($ov);

            $cmd = escapeshellarg($ffmpeg) . ' -y -hide_banner -loglevel error'
                 . ' -framerate 30 -loop 1 -t ' . sprintf('%.3f', $sceneDur) . ' -i ' . escapeshellarg($bg)
                 . $ovInput;

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
            sg_notify_failure('SmartGarden: το βίντεο δεν βγήκε', array(
                'Το άρθρο δημοσιεύτηκε αλλά το βίντεο απέτυχε.',
                '',
                'Άρθρο: ' . ($job['article']['slug'] ?? '?'),
                'Σκηνή:  ' . ($i + 1) . ' από ' . $n,
                'Exit:   ' . $exitCode,
                'ffmpeg: ' . ($res === '' ? '(καμία έξοδος — πιθανό OOM kill)' : $res),
                '',
                'Κατάσταση όλων των render:',
                'https://smartgarden.gr/video-render.php?action=jobs&key=smartgarden_cron_x7K9pQ2026',
            ));
            return;
        }
        if ($res !== '') sg_log($dir, 'scene ' . $i . ' ffmpeg: ' . $res);

        // Recorded from the measured output, not the requested duration: concat -c copy
        // keeps exactly what each scene encoder produced, and a chapter mark that drifts
        // from the picture is worse than no chapter at all.
        if (SG_LONG) {
            $label = trim((string) ($scene['onScreenText'] ?? ''));
            if ($label !== '' && $label !== $lastChapter) {
                $chapters[] = array('at' => $elapsed, 'label' => $label);
                $lastChapter = $label;
            }
            $elapsed += $outDur > 0 ? $outDur : $sceneDur;
        }

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
        sg_notify_failure('SmartGarden: το βίντεο δεν βγήκε', array(
            'Οι σκηνές βγήκαν αλλά η ένωσή τους απέτυχε.',
            '',
            'Άρθρο: ' . ($job['article']['slug'] ?? '?'),
            'ffmpeg: ' . trim((string) $res),
        ));
        return;
    }

    foreach ($sceneFiles as $f) @unlink($f);
    @unlink($listFile);

    // --- music bed ------------------------------------------------------------
    // Optional: any mp3 dropped into public/audio/ becomes a backing track. Tracks are
    // picked per article rather than at random, so re-rendering the same article gives the
    // same video, and consecutive articles don't land on the same track.
    //
    // Mixed in as a separate pass over the finished file with -c:v copy, so adding music
    // costs one audio encode rather than redoing every scene. normalize=0 on amix matters:
    // without it amix halves both inputs and the narration drops with the music.
    $musicDir = __DIR__ . '/audio';
    $tracks = array_values(array_filter((array) glob($musicDir . '/*.mp3'), 'is_file'));
    if (count($tracks)) {
        sort($tracks);
        $seed = 0;
        $slug = (string) ($job['article']['slug'] ?? '');
        for ($k = 0; $k < strlen($slug); $k++) $seed += ord($slug[$k]);
        $track = $tracks[$seed % count($tracks)];

        $withMusic = $dir . '/video_music.mp4';
        $total = sg_duration($ffprobe, $final);
        $musicOut = max(0.5, $total - 1.6);

        // These tracks are about thirty seconds each. Looping one of them under a
        // twenty-second Short is unnoticeable; looping it under a fifteen-minute episode
        // plays the same thirty seconds thirty times, which is worse than no music at all.
        // Long form gets the whole library in a rotation instead, and quieter: fifteen
        // minutes of bed at 0.20 fights the narration in a way twenty seconds never did.
        $musicInput = ' -stream_loop -1 -i ' . escapeshellarg($track);
        $bedVolume = '0.20';
        if (SG_LONG && count($tracks) > 1) {
            $rotation = array_merge(array_slice($tracks, $seed % count($tracks)), array_slice($tracks, 0, $seed % count($tracks)));
            $playlist = $dir . '/music.txt';
            $plLines = '';
            foreach ($rotation as $t) $plLines .= "file '" . str_replace("'", "'\\''", $t) . "'\n";
            file_put_contents($playlist, $plLines);
            $musicInput = ' -stream_loop -1 -f concat -safe 0 -i ' . escapeshellarg($playlist);
            $bedVolume = '0.13';
            sg_log($dir, 'music: rotation of ' . count($rotation) . ' tracks at ' . $bedVolume);
        }

        // aresample is explicit here because the concat demuxer hands over whatever the
        // first file's rate happens to be and the rest are assumed to match.
        $bed = '[1:a]aresample=44100,volume=' . $bedVolume
             . ',afade=t=in:st=0:d=1.2'
             . ',afade=t=out:st=' . sprintf('%.2f', $musicOut) . ':d=1.6[bed]';
        $mix = '[0:a][bed]amix=inputs=2:duration=first:normalize=0[a]';

        $mcmd = escapeshellarg($ffmpeg) . ' -y -hide_banner -loglevel error'
              . ' -i ' . escapeshellarg($final)
              . $musicInput
              . ' -filter_complex ' . escapeshellarg($bed . ';' . $mix)
              . ' -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2'
              . ' -shortest -movflags +faststart ' . escapeshellarg($withMusic) . ' 2>&1';

        $mres = trim((string) @shell_exec($mcmd));
        $mdur = file_exists($withMusic) ? sg_duration($ffprobe, $withMusic) : 0.0;
        if ($mdur >= $total - 0.5) {
            @unlink($final);
            @rename($withMusic, $final);
            sg_log($dir, 'music: ' . basename($track) . ' mixed in');
        } else {
            // Best-effort: a video with no music beats no video at all.
            @unlink($withMusic);
            sg_log($dir, 'music FAILED (' . basename($track) . '), keeping narration only: ' . $mres);
        }
    }

    $duration = sg_duration($ffprobe, $final);
    sg_log($dir, 'done: ' . filesize($final) . ' bytes, ' . round($duration, 2) . 's');

    $publish = !empty($job['autoPublish']) ? sg_publish($job, $dir, basename($dir), $chapters, $duration, $final) : null;

    $videoBytes = filesize($final);

    sg_status($dir, 'done', 100, 'Το βίντεο είναι έτοιμο', array(
        'video' => $final,
        'bytes' => $videoBytes,
        'duration' => round($duration, 2),
        'scenes' => $n,
        'publish' => $publish,
    ));

    // Everything except the finished video is dead weight from this point on, and waiting
    // for the next job to clear it is what let the account reach 140% of its 1 GB quota
    // and get suspended. Freed now, while we are certain the render succeeded.
    $freed = sg_strip_intermediates($dir, $final);
    sg_log($dir, 'freed ' . round($freed / 1048576, 1) . 'MB of intermediates; kept '
                . round($videoBytes / 1048576, 1) . 'MB of video. video-jobs now at '
                . round(sg_dirsize(dirname($dir)) / 1048576, 1) . 'MB of ' . SG_JOBS_BUDGET_MB . 'MB.');
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
/**
 * Format chapter marks the way YouTube parses them out of a description.
 *
 * Its rules, and all three have to hold or the whole list is ignored rather than partly
 * applied: the first mark is at 0:00, there are at least three, and none is shorter than
 * ten seconds. Sections that came out too short are folded into the one before them, which
 * is also the right editorial answer — a chapter worth eight seconds is not a chapter.
 */
function sg_format_chapters($chapters, $total) {
    if (!is_array($chapters) || count($chapters) < 3) return '';

    $kept = array();
    foreach ($chapters as $c) {
        $at = (float) $c['at'];
        if (!count($kept)) {
            // The first one is pinned to zero: YouTube requires it, and the title card is
            // always the opening scene anyway.
            $kept[] = array('at' => 0.0, 'label' => $c['label']);
            continue;
        }
        if ($at - $kept[count($kept) - 1]['at'] < 10.0) continue;
        $kept[] = array('at' => $at, 'label' => $c['label']);
    }
    // The last one needs ten seconds of video after it too.
    while (count($kept) > 3 && $total - $kept[count($kept) - 1]['at'] < 10.0) array_pop($kept);
    if (count($kept) < 3) return '';

    $lines = array();
    foreach ($kept as $c) {
        $s = (int) floor($c['at']);
        $stamp = $s >= 3600
            ? sprintf('%d:%02d:%02d', (int) floor($s / 3600), (int) floor(($s % 3600) / 60), $s % 60)
            : sprintf('%d:%02d', (int) floor($s / 60), $s % 60);
        $label = trim(preg_replace('/\s+/u', ' ', $c['label']));
        $lines[] = $stamp . ' ' . mb_substr($label, 0, 90, 'UTF-8');
    }
    return implode("\n", $lines);
}

/**
 * $duration and $final are parameters, and that is the whole point.
 *
 * They were neither — the visibility gate below read them straight out of thin air, and PHP
 * functions do not inherit their caller's scope. So $duration was null on every call,
 * null >= 15 is false, @filesize(null) is false, and the gate that was supposed to let a
 * good render go public could never pass: two of two videos rendered under it went up
 * private with every check failing, including the checks they plainly met at 26.82s and
 * 10.5MB. The email even said which ones failed, which is how it was found.
 */
function sg_publish($job, $dir, $jobId, $chapters = array(), $duration = 0.0, $final = '') {
    $key = $job['key'];
    $script = $job['script'];
    $article = $job['article'];
    $result = array();

    // Public, but only for a render that looks like the ones we have watched.
    //
    // Uploads were private and waiting on a person because on 2026-09-12 a broken
    // 9-minute render with dead air went public. That render would have failed every one
    // of these checks, and a video nobody can see earns nothing: the one public Short on
    // this channel has 277 views, the private ones have zero between them.
    $checks = array();
    // A long-form episode is judged by a different ruler. Under three minutes YouTube may
    // still file a video as a Short, which would put it back in the pool this format exists
    // to leave — so that, not sixty seconds, is the floor here.
    $checks['διάρκεια'] = SG_LONG
        ? ($duration >= 180 && $duration <= 3600)
        : ($duration >= 15 && $duration <= 60);
    $checks['μέγεθος'] = (@filesize($final) > (SG_LONG ? 8000000 : 1000000));
    $checks['σκηνές'] = (count($script['scenes']) >= (SG_LONG ? 10 : 4));
    $failed = array_keys(array_filter($checks, function ($ok) { return !$ok; }));
    $gateSays = count($failed) ? 'private' : 'public';
    // An explicit override wins, but never upward: a render that failed its checks cannot be
    // talked into going public by a query parameter. It exists so a verification upload can
    // be pinned private while the gate still reports what it would have decided.
    $override = isset($job['privacyOverride']) ? $job['privacyOverride'] : null;
    $visibility = ($override && !($gateSays === 'private' && $override === 'public')) ? $override : $gateSays;
    sg_log($dir, 'visibility: ' . $visibility
        . ($override ? ' (override, gate said ' . $gateSays . ')' : '')
        . (count($failed) ? ' (απέτυχε: ' . implode(', ', $failed) . ')' : ''));

    if (count($failed)) {
        require_once __DIR__ . '/notify.php';
        sg_notify_failure('Το βίντεο ανέβηκε private — δεν πέρασε τους ελέγχους', array(
            'Job: ' . $jobId,
            'Απέτυχε: ' . implode(', ', $failed),
            'Διάρκεια: ' . $duration . 's',
            'Δες το στο YouTube Studio πριν το κάνεις public.',
        ));
    }

    $description = $script['youtubeDescription'];
    if (SG_LONG) {
        $marks = sg_format_chapters($chapters, $duration);
        if ($marks !== '') {
            $description .= "\n\nΠεριεχόμενα:\n" . $marks;
            // Parenthesised deliberately: PHP 8 gives + higher precedence than . while PHP 7
            // treats them as equal and left-associative, so without these the same line is a
            // correct count on one version and a string-plus-int on the other.
            sg_log($dir, 'chapters: ' . (substr_count($marks, "\n") + 1) . ' marks');
        } else {
            sg_log($dir, 'chapters: none usable');
        }
    }

    $yt = sg_post_json('https://smartgarden.gr/youtube-publish.php', array(
        'job' => $jobId,
        'key' => $key,
        'title' => $script['youtubeTitle'],
        'description' => $description,
        'privacyStatus' => $visibility,
        // Without this the uploader appends #Shorts to every description, which is exactly
        // the wrong instruction for a twelve-minute video: the whole point of the format is
        // to earn watch hours rather than Shorts views.
        'isShort' => !SG_LONG,
    ));
    $result['youtube'] = array(
        'ok' => !empty($yt['body']['success']),
        'videoId' => isset($yt['body']['videoId']) ? $yt['body']['videoId'] : null,
        'error' => isset($yt['body']['error']) ? $yt['body']['error'] : null,
    );
    sg_log($dir, 'youtube: ' . json_encode($result['youtube'], JSON_UNESCAPED_UNICODE));

    // A 'public' request that YouTube quietly stored as something else is the exact
    // failure mode the visibility gate above was built to prevent — a good render that
    // nobody can see, only this time silent instead of loud. It has to be checked here:
    // youtube-publish.php's own 200/success response does not mean the request was honoured.
    $ytActual = $yt['body']['privacyStatusActual'] ?? null;
    if ($result['youtube']['ok'] && $visibility === 'public' && $ytActual && $ytActual !== 'public') {
        sg_log($dir, 'privacy mismatch: asked public, YouTube stored ' . $ytActual);
        require_once __DIR__ . '/notify.php';
        sg_notify_failure('Το βίντεο ζητήθηκε public αλλά η YouTube το κράτησε ' . $ytActual, array(
            'Job: ' . $jobId,
            'Video ID: ' . $result['youtube']['videoId'],
            'Πέρασε όλους τους ελέγχους ποιότητας — δεν είναι θέμα του render.',
            'Πιθανός λόγος: περιορισμός καναλιού/λογαριασμού, όχι bug στο script.',
            'Δες το στο YouTube Studio.',
        ));
    }

    // TikTok gets Shorts only. A twelve-minute landscape episode is the wrong shape for the
    // platform, and Greece is not in the Creator Rewards Program's country list anyway, so
    // there is nothing there for a long video to earn.
    if (SG_LONG) {
        $result['tiktok'] = array('ok' => false, 'error' => 'Παραλείπεται στα μεγάλα βίντεο');
        sg_log($dir, 'tiktok: skipped (long form)');
    } else {
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
    }

    // Only YouTube is alerted on. TikTok has been failing on purpose since its production
    // app is still in review, and an alert that fires every single day is one nobody reads.
    if (!$result['youtube']['ok']) {
        sg_notify_failure('SmartGarden: το βίντεο δεν ανέβηκε στο YouTube', array(
            'Το βίντεο δημιουργήθηκε κανονικά αλλά το ανέβασμα απέτυχε.',
            '',
            'Άρθρο: ' . ($article['slug'] ?? '?'),
            'Σφάλμα: ' . ($result['youtube']['error'] ?? '(άγνωστο)'),
            '',
            'Συνήθης αιτία: έληξε το refresh token του Google.',
            'Επανασύνδεση: https://smartgarden.gr/youtube-auth-login.php',
        ));
    }

    return $result;
}
