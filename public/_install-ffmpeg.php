<?php
/**
 * One-time ffmpeg installer — retired.
 *
 * ffmpeg 6.0-static and ffprobe now live in /var/www/vhosts/smartgarden.gr/ffmpeg-bin,
 * outside the web root, and video-render.php?action=selftest confirms they run.
 *
 * Neutralised rather than deleted so the file name stays claimed. The working installer is
 * in git history (commit "Render Shorts entirely on the server") if the binaries ever need
 * reinstalling — restore it, deploy, hit it once, then put this stub back.
 */
http_response_code(404);
exit;
