<?php
/**
 * SmartGarden.gr - Shared helpers for the server-side video pipeline.
 *
 * This is the PHP half of what TikTokStudio.tsx does in the browser: it builds the same
 * 6-scene script, picks the same per-scene photos, and draws the same 1080x1920 frames -
 * only here nobody has to sit with a tab open while it records in real time.
 *
 * The photo catalogue is NOT duplicated here: it is read from photo-catalogue.json, which
 * `npm run deploy` regenerates from src/services/imageService.ts. One source of truth, so
 * a photo added on the TypeScript side can't silently go missing on the PHP side.
 */

define('SG_W', 1080);
define('SG_H', 1920);
define('SG_FONT', __DIR__ . '/fonts/NotoSans-Variable.ttf');

// ============================================================================
// Text helpers
// ============================================================================

/** Lowercase and fold Greek accents, so "σπόρους" and "σπορους" compare equal. */
function sg_strip_accents($str) {
    $s = mb_strtolower((string) $str, 'UTF-8');
    $map = array(
        'ά' => 'α', 'έ' => 'ε', 'ή' => 'η', 'ί' => 'ι', 'ϊ' => 'ι', 'ΐ' => 'ι',
        'ό' => 'ο', 'ύ' => 'υ', 'ϋ' => 'υ', 'ΰ' => 'υ', 'ώ' => 'ω', 'ς' => 'σ',
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
    );
    return strtr($s, $map);
}

/**
 * Drop emoji and other pictographs.
 *
 * The browser canvas fell back to a system emoji font for these; GD only has the one TTF we
 * ship, and Noto Sans has no emoji glyphs, so anything left in would render as empty boxes.
 * Step numbers get a drawn badge instead (see sg_render_scene), which reads better anyway.
 */
function sg_strip_emoji($text) {
    $text = preg_replace('/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE00}-\x{FE0F}\x{20E3}\x{2190}-\x{21FF}\x{2300}-\x{23FF}]/u', '', (string) $text);
    return trim(preg_replace('/\s{2,}/u', ' ', $text));
}

/** Width of a string at a given size, via FreeType metrics. */
function sg_text_width($text, $size) {
    $box = imagettfbbox($size, 0, SG_FONT, $text);
    return abs($box[2] - $box[0]);
}

/** Greedy word wrap constrained by real rendered width. */
function sg_wrap_lines($text, $size, $maxWidth) {
    $words = preg_split('/\s+/u', trim((string) $text));
    $lines = array();
    $line = '';
    foreach ($words as $w) {
        if ($w === '') continue;
        $test = $line === '' ? $w : $line . ' ' . $w;
        if ($line !== '' && sg_text_width($test, $size) > $maxWidth) {
            $lines[] = $line;
            $line = $w;
        } else {
            $line = $test;
        }
    }
    if ($line !== '') $lines[] = $line;
    return $lines;
}

/** Trim to a whole word near $max characters. */
function sg_shorten($text, $max) {
    $text = trim((string) $text);
    if (mb_strlen($text, 'UTF-8') <= $max) return $text;
    $cut = mb_substr($text, 0, $max, 'UTF-8');
    $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
    if ($sp !== false && $sp > $max * 0.6) $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    return rtrim($cut, " ,·;:-") . '…';
}

// ============================================================================
// Script building - mirrors the `tikTokScript` memo in TikTokStudio.tsx
// ============================================================================

function sg_build_script($article) {
    $title = isset($article['title']['el']) ? $article['title']['el'] : (string) ($article['title'] ?? '');
    $summary = isset($article['summary']['el']) ? $article['summary']['el'] : (string) ($article['summary'] ?? '');
    $bullets = isset($article['keyTakeaways']['el']) && is_array($article['keyTakeaways']['el'])
        ? $article['keyTakeaways']['el']
        : array('Σωστό υπόστρωμα και στράγγιση', 'Πότισμα μόνο νωρίς το πρωί', 'Οργανική θρέψη και προστασία');

    $cleanTitle = trim(preg_replace('/[\(\):]/u', '', $title));
    $stepFallbacks = array('Σωστή αποστράγγιση', 'Πότισμα μόνο όταν στεγνώσει το χώμα', 'Οργανικό λίπασμα');
    $stepOrdinals = array('Πρώτον', 'Δεύτερον', 'Τρίτον');

    // Same three pools as the browser: a "you made a mistake" hook is wrong for a
    // step-by-step guide or a Q&A piece, so the title decides which pool is used.
    $problemHookAngles = array(
        array('hookTag' => 'THE HOOK', 'hookVoiceover' => 'Μην κάνεις ποτέ αυτό το λάθος με τα φυτά σου στο μπαλκόνι',
              'hookText' => 'Το λάθος που κάνουν όλοι', 'problemTag' => 'ΤΟ ΠΡΟΒΛΗΜΑ',
              'problemText' => 'Αν το αγνοήσεις, οι ρίζες ασφυκτιούν'),
        array('hookTag' => 'PLANT AUTOPSY', 'hookVoiceover' => 'Ας κάνουμε αυτοψία σε αυτό το άρρωστο φυτό',
              'hookText' => 'Αυτοψία Φυτού', 'problemTag' => 'Η ΔΙΑΓΝΩΣΗ',
              'problemText' => 'Να τι πραγματικά συμβαίνει από μέσα'),
        array('hookTag' => 'SOIL DETECTIVE', 'hookVoiceover' => 'Ντετέκτιβ χώματος εδώ, ας λύσουμε αυτό το μυστήριο',
              'hookText' => 'Το Μυστήριο του Χώματος', 'problemTag' => 'ΤΑ ΣΤΟΙΧΕΙΑ',
              'problemText' => 'Τα στοιχεία δείχνουν προς ένα σαφές πρόβλημα'),
        array('hookTag' => 'MYTH COURT', 'hookVoiceover' => 'Στο δικαστήριο μύθων κηπουρικής σήμερα εξετάζουμε αυτό',
              'hookText' => 'Μύθος ή Αλήθεια;', 'problemTag' => 'Η ΕΝΟΧΗ ΑΠΟΔΕΙΞΗ',
              'problemText' => 'Η επιστήμη λέει κάτι διαφορετικό'),
    );
    $guideHookAngles = array(
        array('hookTag' => 'QUICK GUIDE', 'hookVoiceover' => 'Κράτα αυτό το βίντεο, θα σου χρειαστεί',
              'hookText' => 'Ο Οδηγός που Έψαχνες', 'problemTag' => 'ΤΙ ΘΑ ΜΑΘΕΙΣ',
              'problemText' => 'Όλα τα βήματα, απλά και κατανοητά'),
        array('hookTag' => 'STEP BY STEP', 'hookVoiceover' => 'Ο πιο εύκολος τρόπος να το πετύχεις σωστά από την πρώτη φορά',
              'hookText' => 'Βήμα προς Βήμα', 'problemTag' => 'Ο ΟΔΗΓΟΣ',
              'problemText' => 'Ακολούθησε τα βήματα με τη σειρά'),
    );
    $qaHookAngles = array(
        array('hookTag' => 'Q&A', 'hookVoiceover' => 'Απαντάμε στις πιο συχνές ερωτήσεις σας για αυτό',
              'hookText' => 'Οι Ερωτήσεις σου, Απαντημένες', 'problemTag' => 'Η ΕΡΩΤΗΣΗ',
              'problemText' => 'Αυτό ρωτάνε οι περισσότεροι'),
    );

    $lower = mb_strtolower($cleanTitle, 'UTF-8');
    if (preg_match('/ερωτ[ήη]σει|απαντ[ήη]σει/u', $lower)) {
        $pool = $qaHookAngles;
    } elseif (preg_match('/οδηγ[όο]ς|βήμα.{0,3}βήμα|πλήρης οδηγ/u', $lower)) {
        $pool = $guideHookAngles;
    } else {
        $pool = $problemHookAngles;
    }

    // Deterministic per article, so re-running a job produces the identical video.
    $id = (string) ($article['id'] ?? '');
    $sum = 0;
    for ($i = 0; $i < strlen($id); $i++) $sum += ord($id[$i]);
    $angle = $pool[count($pool) ? $sum % count($pool) : 0];

    $scenes = array(
        array(
            'tag' => $angle['hookTag'],
            'voiceover' => $angle['hookVoiceover'],
            'onScreenText' => $angle['hookText'],
            'step' => 0,
        ),
        array(
            'tag' => $angle['problemTag'],
            'voiceover' => sg_shorten($summary, 130),
            'onScreenText' => $angle['problemText'],
            'step' => 0,
        ),
    );

    // One scene per step, so the text on screen is always the step being spoken.
    for ($i = 0; $i < 3; $i++) {
        $bullet = isset($bullets[$i]) && trim($bullets[$i]) !== '' ? $bullets[$i] : $stepFallbacks[$i];
        $scenes[] = array(
            'tag' => 'ΒΗΜΑ ' . ($i + 1),
            'voiceover' => $stepOrdinals[$i] . ': ' . sg_shorten($bullet, 165),
            // Generous, because the renderer wraps to four lines and shrinks the type to fit.
            // Cutting at 95 chars put an ellipsis in the middle of most takeaways.
            'onScreenText' => sg_shorten($bullet, 150),
            'step' => $i + 1,
        );
    }

    $scenes[] = array(
        'tag' => 'CALL TO ACTION',
        // Spoken text differs from the caption on purpose: Greek TTS mangles "SmartGarden.gr",
        // so the audio gets a phonetic spelling while the screen shows the real one.
        'voiceover' => 'Αποθήκευσε το για αργότερα και δες τον πλήρη οδηγό στο Σμαρτ Γκάρντεν τελεία τζι-αρ',
        'onScreenText' => 'Αποθήκευσέ το για αργότερα',
        'captionDisplay' => 'Αποθήκευσε το για αργότερα και δες τον πλήρη οδηγό στο SmartGarden.gr',
        'step' => 0,
    );

    $slug = (string) ($article['slug'] ?? '');
    $tiktokCaption = "🌿 {$cleanTitle} | Μυστικά & Tips για το Μπαλκόνι!\n"
        . "👇 Διαβάστε τον πλήρη επιστημονικό οδηγό στο: https://smartgarden.gr/article/{$slug}\n\n"
        . '#smartgarden #plants #gardening #gardentips #balconygarden #fyp #foryou #foryoupage '
        . '#viralgreece #fygr #φυτα #μπαλκονι #κηπουρικη #λουλουδια #αθηνα';

    $youtubeDescription = "{$cleanTitle} — Πλήρης οδηγός βήμα-βήμα από το SmartGarden.gr 🌿\n\n"
        . sg_shorten($summary, 200) . "\n\n"
        . "📖 Διαβάστε ολόκληρο τον επιστημονικό οδηγό: https://smartgarden.gr/article/{$slug}\n"
        . "🌱 Περισσότεροι οδηγοί κηπουρικής & μπαλκονιού: https://smartgarden.gr\n\n"
        . '#Shorts #κηπουρικη #μπαλκονι #gardening';

    return array(
        'title' => $title,
        'cleanTitle' => $cleanTitle,
        'scenes' => $scenes,
        'tiktokCaption' => $tiktokCaption,
        'youtubeDescription' => $youtubeDescription,
        'youtubeTitle' => sg_shorten($cleanTitle, 95),
    );
}

// ============================================================================
// Per-scene photo selection - port of getSceneImages() in imageService.ts
// ============================================================================

function sg_load_catalogue() {
    $path = __DIR__ . '/photo-catalogue.json';
    $data = file_exists($path) ? json_decode(file_get_contents($path), true) : null;
    if (!is_array($data) || empty($data['curated'])) {
        return array('curated' => array(), 'neutral' => array(), 'fallback' => array());
    }
    return $data;
}

/**
 * Score how well a photo's keywords match a piece of scene text.
 *
 * Greek inflects hard - an article says "σπόρους" where the keyword is "σποροι" - so a plain
 * substring test matches almost nothing. Keywords of 6+ chars also match on their stem.
 */
function sg_match_score($text, $keywords) {
    $haystack = sg_strip_accents($text);
    $score = 0;
    foreach ((array) $keywords as $kw) {
        $normKw = sg_strip_accents($kw);
        $len = mb_strlen($normKw, 'UTF-8');
        if ($len < 4) continue;
        if (mb_strpos($haystack, $normKw, 0, 'UTF-8') !== false) { $score += $len; continue; }
        if ($len >= 6) {
            $stem = mb_substr($normKw, 0, $len - 2, 'UTF-8');
            if (mb_strpos($haystack, $stem, 0, 'UTF-8') !== false) $score += $len - 2;
        }
    }
    return $score;
}

/**
 * One photo per scene, matched to what that scene actually talks about.
 *
 * Scene 0 keeps the article's own hero photo. Every other scene takes the best-scoring
 * unused photo; when nothing scores, it falls back to the article topic, then to neutral
 * gardening shots - never to a category lottery, which is how a weed-control video once
 * ended up showing lemons.
 */
function sg_scene_images($sceneTexts, $articleImage, $articleTitle, $category) {
    $cat = sg_load_catalogue();
    $curated = $cat['curated'];
    $neutral = !empty($cat['neutral']) ? $cat['neutral'] : array();
    $fallback = !empty($cat['fallback']) ? $cat['fallback'] : array();

    $used = array();
    $result = array();
    if ($articleImage) $used[$articleImage] = true;

    $titleMatches = array();
    foreach ($curated as $p) {
        if (sg_match_score($articleTitle . ' ' . $category, $p['keywords']) > 0) $titleMatches[] = $p['url'];
    }

    $neutralIdx = 0;
    $fallbackIdx = 0;

    foreach ($sceneTexts as $i => $text) {
        if ($i === 0 && $articleImage) { $result[] = $articleImage; continue; }

        $bestUrl = null;
        $bestScore = 0;
        foreach ($curated as $p) {
            $s = sg_match_score($text, $p['keywords']);
            if ($s <= 0) continue;
            if (isset($used[$p['url']])) $s -= 100;
            if ($s > $bestScore) { $bestScore = $s; $bestUrl = $p['url']; }
        }

        if ($bestUrl === null) {
            foreach ($titleMatches as $u) {
                if (!isset($used[$u])) { $bestUrl = $u; break; }
            }
        }
        if ($bestUrl === null) {
            while ($neutralIdx < count($neutral)) {
                $u = $neutral[$neutralIdx++];
                if (!isset($used[$u])) { $bestUrl = $u; break; }
            }
        }
        if ($bestUrl === null) {
            while ($fallbackIdx < count($fallback)) {
                $u = $fallback[$fallbackIdx++];
                if (!isset($used[$u])) { $bestUrl = $u; break; }
            }
        }
        if ($bestUrl === null) {
            $bestUrl = $articleImage ?: (count($neutral) ? $neutral[0] : (count($fallback) ? $fallback[0] : ''));
        }

        $used[$bestUrl] = true;
        $result[] = $bestUrl;
    }

    return $result;
}

// ============================================================================
// Frame rendering with GD
// ============================================================================

/**
 * Download a URL to a local file; returns false on any failure.
 *
 * Tries curl, then PHP's own https stream wrapper. The fallback isn't belt-and-braces: this
 * host's curl is built against a TLS backend that rejects images.unsplash.com outright with
 * "Certificate key usage inadequate for attempted operation", while the stream wrapper goes
 * through OpenSSL and validates the same chain happily. Both paths keep verification on.
 */
function sg_fetch_to_file($url, $dest, $timeout = 45) {
    $ua = 'Mozilla/5.0 (compatible; SmartGardenBot/1.0; +https://smartgarden.gr)';

    $fp = @fopen($dest, 'w');
    if ($fp) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => $ua,
        ));
        $ok = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);
        if ($ok && $status < 400 && @filesize($dest) >= 1000) return true;
        @unlink($dest);
    }

    $ctx = stream_context_create(array(
        'http' => array('timeout' => $timeout, 'user_agent' => $ua, 'follow_location' => 1, 'max_redirects' => 5),
        'ssl'  => array('verify_peer' => true, 'verify_peer_name' => true),
    ));
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false || strlen($body) < 1000) return false;
    return (bool) @file_put_contents($dest, $body);
}

/** Load a JPEG/PNG/WebP file into a GD resource. */
function sg_load_image($path) {
    $info = @getimagesize($path);
    if (!$info) return null;
    switch ($info[2]) {
        case IMAGETYPE_JPEG: return @imagecreatefromjpeg($path);
        case IMAGETYPE_PNG:  return @imagecreatefrompng($path);
        case IMAGETYPE_WEBP: return function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null;
        case IMAGETYPE_GIF:  return @imagecreatefromgif($path);
    }
    return null;
}

/**
 * Scale-and-crop a photo to fill exactly $w x $h ("cover"), matching what the browser's
 * canvas drawImage did. Written to $dest as JPEG.
 *
 * Rendered slightly larger than the final frame so ffmpeg's Ken-Burns zoom has real pixels
 * to zoom into rather than upscaling a 1080-wide source.
 */
function sg_render_background($photoPath, $dest, $w = 1350, $h = 2400) {
    $src = sg_load_image($photoPath);
    if (!$src) return false;

    $sw = imagesx($src);
    $sh = imagesy($src);
    $scale = max($w / $sw, $h / $sh);
    $nw = (int) ceil($sw * $scale);
    $nh = (int) ceil($sh * $scale);

    $canvas = imagecreatetruecolor($w, $h);
    // Dark botanical base, same as the canvas version's gradient fill.
    imagefilledrectangle($canvas, 0, 0, $w, $h, imagecolorallocate($canvas, 3, 23, 16));
    imagecopyresampled($canvas, $src, (int) (($w - $nw) / 2), (int) (($h - $nh) / 2), 0, 0, $nw, $nh, $sw, $sh);
    imagedestroy($src);

    // The browser drew the photo at 0.85 alpha over the dark gradient; same effect here.
    $shade = imagecreatetruecolor($w, $h);
    imagefilledrectangle($shade, 0, 0, $w, $h, imagecolorallocate($shade, 3, 23, 16));
    imagecopymerge($canvas, $shade, 0, 0, 0, 0, $w, $h, 15);
    imagedestroy($shade);

    $ok = imagejpeg($canvas, $dest, 92);
    imagedestroy($canvas);
    return $ok;
}

/** Bold white text with a soft black outline - no background box. */
function sg_outlined_text($img, $text, $centerX, $y, $size, $white, $black, $spread = null) {
    if ($spread === null) $spread = max(2, (int) round($size * 0.09));
    $width = sg_text_width($text, $size);
    $x = (int) ($centerX - $width / 2);
    for ($dx = -$spread; $dx <= $spread; $dx += $spread) {
        for ($dy = -$spread; $dy <= $spread; $dy += $spread) {
            if ($dx === 0 && $dy === 0) continue;
            imagettftext($img, $size, 0, $x + $dx, $y + $dy, $black, SG_FONT, $text);
        }
    }
    imagettftext($img, $size, 0, $x, $y, $white, SG_FONT, $text);
    return $width;
}

/**
 * The transparent text/gradient layer that sits on top of the moving photo.
 *
 * Kept separate from the background so ffmpeg can Ken-Burns the photo underneath while the
 * text stays pin-sharp and never drifts out of frame.
 */
function sg_render_overlay($scene, $dest) {
    $img = imagecreatetruecolor(SG_W, SG_H);
    imagesavealpha($img, true);
    imagealphablending($img, false);
    imagefilledrectangle($img, 0, 0, SG_W, SG_H, imagecolorallocatealpha($img, 0, 0, 0, 127));
    imagealphablending($img, true);

    // Cinematic top gradient (dark at the very top, clear by y=450).
    for ($y = 0; $y < 450; $y++) {
        $alpha = (int) round(127 - (0.9 * (1 - $y / 450)) * 127);
        imageline($img, 0, $y, SG_W, $y, imagecolorallocatealpha($img, 0, 0, 0, $alpha));
    }
    // Bottom gradient. Deliberately shorter and lighter than a straight port of the browser
    // version: at 850px of near-solid black it swallowed almost half the photo.
    $bottomHeight = 760;
    $bottomStart = SG_H - $bottomHeight;
    for ($y = $bottomStart; $y < SG_H; $y++) {
        $t = ($y - $bottomStart) / $bottomHeight;
        $opacity = $t < 0.4 ? ($t / 0.4) * 0.72 : 0.72 + (($t - 0.4) / 0.6) * 0.22;
        $alpha = (int) round(127 - $opacity * 127);
        imageline($img, 0, $y, SG_W, $y, imagecolorallocatealpha($img, 0, 0, 0, $alpha));
    }

    $white = imagecolorallocate($img, 255, 255, 255);
    // Near-opaque outline: at alpha 40 the text had no punch against a busy photo.
    $black = imagecolorallocatealpha($img, 0, 0, 0, 12);
    $softWhite = imagecolorallocatealpha($img, 255, 255, 255, 18);

    // Small watermark, top-left.
    imagettftext($img, 26, 0, 60, 110, $softWhite, SG_FONT, '@smartgarden68');

    // A drawn number badge for the step scenes - replaces the 1️⃣ emoji the browser got
    // from a system font and GD has no glyph for.
    $hookText = sg_strip_emoji($scene['onScreenText']);
    $step = isset($scene['step']) ? (int) $scene['step'] : 0;

    // Start big and only shrink if the line count demands it. Shorts are watched on a phone
    // at arm's length, so undersized captions are the single most damaging thing here.
    $hookSize = 58;
    $maxHookWidth = SG_W - 130;
    $hookLines = sg_wrap_lines($hookText, $hookSize, $maxHookWidth);
    while (count($hookLines) > 4 && $hookSize > 38) {
        $hookSize -= 3;
        $hookLines = sg_wrap_lines($hookText, $hookSize, $maxHookWidth);
    }

    $lineHeight = (int) round($hookSize * 1.28);
    // Centre the block on ~48% height: below the middle, clear of the Shorts/TikTok UI
    // that crowds the bottom fifth of the screen.
    $hookY = 920 - (int) ((count($hookLines) - 1) * $lineHeight / 2);

    if ($step > 0) {
        $badgeR = 46;
        $badgeY = $hookY - $lineHeight - 50;
        $badgeX = (int) (SG_W / 2);
        imagefilledellipse($img, $badgeX, $badgeY, $badgeR * 2, $badgeR * 2, imagecolorallocate($img, 46, 107, 58));
        imagesetthickness($img, 5);
        imageellipse($img, $badgeX, $badgeY, $badgeR * 2, $badgeR * 2, $white);
        $num = (string) $step;
        $numW = sg_text_width($num, 48);
        imagettftext($img, 48, 0, (int) ($badgeX - $numW / 2), $badgeY + 18, $white, SG_FONT, $num);
    }

    foreach ($hookLines as $line) {
        sg_outlined_text($img, $line, SG_W / 2, $hookY, $hookSize, $white, $black);
        $hookY += $lineHeight;
    }

    // Subtitle strip. captionDisplay wins when a scene sets one, so the CTA scene's
    // phonetic "Σμαρτ Γκάρντεν" never leaks onto the screen.
    // Skipped on step scenes: there the narration is just "Πρώτον: <the bullet>" and the
    // bullet is already the headline, so the strip only reprinted the same sentence in
    // smaller type under itself.
    if ($step === 0) {
        $captionSource = !empty($scene['captionDisplay']) ? $scene['captionDisplay'] : $scene['voiceover'];
        $captionSource = sg_strip_emoji(str_replace(array('«', '»'), '', $captionSource));
        $capLines = array_slice(sg_wrap_lines($captionSource, 33, SG_W - 180), 0, 2);
        $capY = max(1200, $hookY + 70);
        foreach ($capLines as $line) {
            sg_outlined_text($img, $line, SG_W / 2, $capY, 33, $softWhite, $black, 3);
            $capY += 48;
        }
    }

    // Footer link.
    $footer = 'smartgarden.gr';
    $fw = sg_text_width($footer, 26);
    imagettftext($img, 26, 0, (int) ((SG_W - $fw) / 2), SG_H - 90, $softWhite, SG_FONT, $footer);

    $ok = imagepng($img, $dest, 6);
    imagedestroy($img);
    return $ok;
}
