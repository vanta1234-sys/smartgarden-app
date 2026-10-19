# Video and ops tooling

These scripts used to live only in a temporary session folder, and a context reset once lost the slide-timing script. They are kept here
so any later session can repeat the work. They were written to run from a scratch folder with `node_modules` (basic-ftp, php-parser) and
Python with Pillow; paths inside them point at that layout, so copy a folder next to `node_modules` and adjust the few constants at the top.
Nothing here is wired into the site build.

## Making a long (about 16 minute) video, in order

1. **Script**: `lemon/make_script_lemon.cjs` (also `garlic/make_script.cjs`, `lavender/make_script_lav.cjs`). Hand-written scenes
   `[photo name, heading, spoken text]`. The builder refuses Latin letters, symbols (`( ) « » % + °`), scenes over 460 characters, the same
   photo twice in a row and Unsplash+ photos. Output `<name>-long.json` goes to `public/video-scripts/` and to `/httpdocs/video-scripts/`.
2. **Photos**: Unsplash search pages in the browser pane (the `/napi` API now answers with a bot check, do not script it), thumbnails with
   curl, labelled contact sheets (`lemon/sheets.py`), look at every one. `cand_raw.txt` is the id list of each video.
3. **Dry run**: `video-render.php?action=start&slug=..&mode=long&script=NAME&dry=1&full=1&key=..` (the server must see 53 scenes and distinct photos).
4. **Slides**: `lemon/build_slides_lemon.py` + `slides_lemon_body.py` build twelve 1920x1080 PNGs from `garlic/slides_garlic.py` (machinery).
   Preview over the photos with `lemon/preview_slides.py`. Upload to `public/_slides/` (new names for every new version: the overlay resumes by
   spec and will not re-encode a changed PNG with an old name).
5. **Narration first** (since 2026-10-18): `ops/narration_prep.py <script.json> --upload` asks Gemini for every ~1,400 character chunk (paced), cuts it into
   scenes with the worker's pause-matching and then CHECKS every cut by transcribing each scene (`public/asr-check.php`), moving cuts that are words too
   late or early. Audio and `<sha1>.cuts.json` go into the server cache; the worker uses the hint file instead of its own guess. Reason: the
   transcription of the garlic video showed the guess one or two sentences late on one chunk (scenes 17-20). `ops/verify_narration.cjs` re-checks a
   finished render scene by scene.
6. **Render**: one job at a time (two at once die with exit 137). The Gemini narration needs about 12-14 requests of the 10-a-day-per-key allowance.
   `long/start.sh <config.json>` (run from an empty scratch folder) waits for `startAfterUtc` if the config has one, prepares the narration (step 5), starts the
   render, waits for it and runs step 7. The per-video facts live in a small config (`lemon/lemon.config.json`, `lavender/lav.config.json`): scene count,
   which scenes each slide covers (`holds`), the YouTube title, description lead, hashtags, chapters (first scene of each), thumbnail, article slug.
   A new video = a new config, not a copy of the scripts. 52-53 scenes take about 25 minutes of narration and 35 of encoding.
7. **After the render**: `long/post_render.cjs <config.json>` (cwd = the run folder; `--dry` stops before the overlay) computes the slide spec from the real scene
   starts, runs the overlay (restarting only while it says "Κομμάτι", never during the join; a start call that times out is not a failure, the work
   continues on the server), downloads both versions and checks duration, audio md5 and motion under the slides, then transcribes every scene.
   A scene the check flags is not a verdict: re-transcribe it with `gemini-3.6-flash` and read the neighbouring scene for the missing words.
8. **Look at it** (contact sheet, listen) and only then, on the owner's word, `long/yt_upload.cjs <config.json>` (`--dry` prints title, description and chapters;
   private by default). To make it public afterwards use `youtube-set-status.php` (needs the cron key AND the X-YT-Admin secret, see memory), only on the owner's word.

## Daily article pool

`pool/build_pool.cjs` turns hand-written markdown into `topicPool` entries (nowdoc, CRLF) inside `public/cron-publish.php`; `proofread_fixes.py`
shows how to patch both the markdown and the PHP with exact replacements. Check `cron-publish.php?shapes=1` (header `X-Cron-Key`) after a deploy.

## Ops

- `ops/compare_public.cjs`: dry compare of every top-level `public/` file against the live copy. Run before a full deploy.
- `ops/bisect_zero.cjs`: uploads line ranges of a file under throw-away names to find what the host blanks (see memory video-inserts-zeroed).
- `ops/upload_with_baseline.cjs`, `upload_files.cjs`, `ftp_put.cjs`: guarded single-file uploads (live must equal what we last uploaded / HEAD).
- `ops/lint.cjs`: PHP syntax check without PHP (php-parser). Beware: backslashes in heredocs through the shell are halved; use `chr(92)` or an editor.
- `ops/split_proto.py`: the prototype of the pace-based silence splitter now ported to PHP (`sg_split_points` in `public/video-worker.php`).
