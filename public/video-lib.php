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
    // preg with /u, not rtrim: rtrim strips BYTES, and "·" is 0xC2 0xB7 in UTF-8 while "η"
    // is 0xCE 0xB7. Trimming a Greek word ending in "η" tore the character in half, left the
    // string invalid UTF-8, and made json_encode return false further up — which surfaced as
    // an empty job.json and "job.json unreadable" from the worker.
    return preg_replace('/[\s,·;:\-]+$/u', '', $cut) . '…';
}

/**
 * One spoken line for a scene, never cut mid-thought.
 *
 * sg_shorten cut at a fixed 58 characters and appended an ellipsis. The key takeaways are
 * 83-93 characters and each is a single sentence whose point lands after a colon or a dash,
 * so 58 removed exactly the part worth hearing: "μεταβολισμό CAM: ανοίγει στομάτια…",
 * "η διαπνοή πέφτει: το πότισμα πρέπει να…". The viewer was left with the setup and none of
 * the answer, four times in a row.
 *
 * So: keep a whole sentence when one fits, otherwise fall back to the last clause boundary
 * and finish with a full stop rather than an ellipsis — and never end on a word like "να"
 * or "πρέπει", which promises something that is not coming.
 */
function sg_scene_line($text, $max) {
    $t = trim(preg_replace('/\s+/u', ' ', (string) $text));
    if ($t === '') return '';
    if (mb_strlen($t, 'UTF-8') <= $max) return $t;

    // A complete sentence that fits is always the best answer.
    if (preg_match_all('/[.!;]/u', mb_substr($t, 0, $max, 'UTF-8'), $m, PREG_OFFSET_CAPTURE)) {
        $last = end($m[0]);
        $upto = mb_strlen(substr($t, 0, $last[1] + strlen($last[0])), 'UTF-8');
        if ($upto >= $max * 0.5) return mb_substr($t, 0, $upto, 'UTF-8');
    }

    $cut = mb_substr($t, 0, $max, 'UTF-8');
    // Clause boundaries, in order of how cleanly they close a thought.
    foreach (array('—', '–', ':', ',') as $sep) {
        $at = mb_strrpos($cut, $sep, 0, 'UTF-8');
        if ($at !== false && $at >= $max * 0.5) { $cut = mb_substr($cut, 0, $at, 'UTF-8'); break; }
    }
    if (mb_strlen($cut, 'UTF-8') === $max) {
        $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
        if ($sp !== false && $sp >= $max * 0.5) $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    }

    // Words that only make sense with what follows them.
    $dangling = array('να', 'θα', 'και', 'σε', 'με', 'για', 'από', 'πρέπει', 'μπορεί', 'το',
                      'τη', 'την', 'τον', 'τα', 'του', 'της', 'των', 'ή', 'που', 'ως', 'στο', 'στη');
    for ($i = 0; $i < 3; $i++) {
        $cut = preg_replace('/[\s,·;:\-—–]+$/u', '', $cut);
        $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
        if ($sp === false) break;
        $lastWord = mb_strtolower(mb_substr($cut, $sp + 1, null, 'UTF-8'), 'UTF-8');
        if (!in_array($lastWord, $dangling, true)) break;
        $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    }
    $cut = preg_replace('/[\s,·;:\-—–]+$/u', '', $cut);
    return $cut === '' ? mb_substr($t, 0, $max, 'UTF-8') : $cut . '.';
}

/**
 * Lay spoken words out into centred lines and hand back a box for each one.
 *
 * Positions come from the same FreeType metrics GD draws with, so a word measured here
 * lands where ffmpeg's drawtext puts it. Returned y values are the TOP of each line,
 * which is what drawtext expects — GD's own text calls use a baseline instead.
 */
function sg_layout_words($words, $size, $maxWidth, $centerX, $topY, $lineHeight) {
    // Measuring a lone " " with imagettfbbox gives a bounding box, not an advance, and comes
    // back far too wide. The difference between two strings that differ only by one space is
    // the real advance.
    $spaceW = max(1, sg_text_width('ΑΑ ΑΑ', $size) - sg_text_width('ΑΑΑΑ', $size));
    $lines = array();
    $cur = array();
    $curW = 0;

    foreach ($words as $w) {
        $t = trim((string) ($w['text'] ?? ''));
        if ($t === '') continue;
        $wid = sg_text_width($t, $size);
        $need = (count($cur) ? $spaceW : 0) + $wid;
        if (count($cur) && $curW + $need > $maxWidth) {
            $lines[] = array($cur, $curW);
            $cur = array();
            $curW = 0;
            $need = $wid;
        }
        $cur[] = array('text' => $t, 'width' => $wid, 'start' => $w['start'], 'end' => $w['end']);
        $curW += $need;
    }
    if (count($cur)) $lines[] = array($cur, $curW);

    $out = array();
    foreach ($lines as $li => $ln) {
        list($items, $lineW) = $ln;
        $x = $centerX - $lineW / 2;
        $y = $topY + $li * $lineHeight;
        foreach ($items as $it) {
            $out[] = array(
                'text' => $it['text'],
                'start' => $it['start'],
                'end' => $it['end'],
                'x' => (int) round($x),
                'y' => (int) round($y),
            );
            $x += $it['width'] + $spaceW;
        }
    }
    return $out;
}

/** How many lines sg_layout_words will produce, so the block can be centred vertically. */
function sg_count_word_lines($layout) {
    $ys = array();
    foreach ($layout as $w) $ys[$w['y']] = true;
    return max(1, count($ys));
}

// ============================================================================
// Script building - mirrors the `tikTokScript` memo in TikTokStudio.tsx
// ============================================================================

/**
 * Which hook pool an article title falls into: qa, guide or problem.
 *
 * Pulled out of sg_build_script so the analytics side can group videos by the same
 * classification the renderer used — otherwise "which hook style holds attention" is
 * answered against a different definition than the one that produced the videos.
 */
function sg_hook_pool_name($title) {
    $lower = mb_strtolower(trim(preg_replace('/[\(\):]/u', '', (string) $title)), 'UTF-8');
    if (preg_match('/ερωτ[ήη]σει|απαντ[ήη]σει/u', $lower)) return 'qa';
    if (preg_match('/οδηγ[όο]ς|βήμα.{0,3}βήμα|πλήρης οδηγ/u', $lower)) return 'guide';
    return 'problem';
}

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

    $poolName = sg_hook_pool_name($cleanTitle);
    $pool = $poolName === 'qa' ? $qaHookAngles : ($poolName === 'guide' ? $guideHookAngles : $problemHookAngles);

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
            // Greek TTS runs at roughly 17 characters a second, so these caps are really
            // duration caps. The whole video targets ~20s: past that, watch-through on a
            // Short falls off a cliff and the payoff never gets seen.
            'voiceover' => sg_scene_line($summary, 95),
            'onScreenText' => $angle['problemText'],
            'step' => 0,
        ),
    );

    // One scene per step, so the text on screen is always the step being spoken.
    for ($i = 0; $i < 3; $i++) {
        $bullet = isset($bullets[$i]) && trim($bullets[$i]) !== '' ? $bullets[$i] : $stepFallbacks[$i];
        $scenes[] = array(
            'tag' => 'ΒΗΜΑ ' . ($i + 1),
            // No spoken "Πρώτον/Δεύτερον" any more: the numbered badge on screen already
            // says which step this is, and the word cost most of a second each time.
            'voiceover' => sg_scene_line($bullet, 95),
            // Generous, because the renderer wraps to four lines and shrinks the type to fit.
            // Cutting at 95 chars put an ellipsis in the middle of most takeaways.
            'onScreenText' => sg_scene_line($bullet, 95),
            'step' => $i + 1,
        );
    }

    $scenes[] = array(
        'tag' => 'CALL TO ACTION',
        // Spoken text differs from the caption on purpose: Greek TTS mangles "SmartGarden.gr",
        // so the audio gets a phonetic spelling while the screen shows the real one.
        'voiceover' => 'Όλος ο οδηγός στο Σμαρτ Γκάρντεν τελεία τζι-αρ',
        'onScreenText' => 'Αποθήκευσέ το για αργότερα',
        'captionDisplay' => 'Όλος ο οδηγός στο SmartGarden.gr',
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
        $data = array('curated' => array(), 'neutral' => array(), 'fallback' => array());
    }

    // Our own garden photographs join the curated pool, keyed on the same words that decide
    // which article they illustrate. A real photograph of a pepper, taken here, beats a
    // stock photograph of something else — and it is the same standard the articles are
    // held to.
    $own = json_decode((string) @file_get_contents(__DIR__ . '/real-photos.json'), true);
    if (is_array($own)) {
        foreach ($own as $photo) {
            if (empty($photo['file']) || empty($photo['match'])) continue;
            $data['curated'][] = array(
                'url' => 'https://smartgarden.gr' . $photo['file'],
                'keywords' => $photo['match'],
                'own' => true,
            );
        }
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
            // Our own photographs are chosen per article, not per sentence, so they are
            // scored against the article's subject as well: a video about peppers should
            // use our photograph of a pepper even in a scene that does not repeat the word.
            $s = sg_match_score($text, $p['keywords']);

            // A photo that agrees with what the article is about counts for more than one
            // that merely shares a word with the sentence. Without this, a scene explaining
            // that a ZZ plant stores water matched an irrigation photo on "πότισμα" and
            // showed a field of rocket being hosed in a video about houseplants.
            $subjectScore = sg_match_score($articleTitle . ' ' . $category, $p['keywords']);
            $s += $subjectScore * 2;

            if ($s <= 0) continue;
            // Our own photographs carry one or two keywords where a stock entry carries
            // eight, so on raw score they lost every time. When ours matches the scene at
            // all, it is a photograph of this plant taken in a real garden, which is worth
            // more than a closer keyword count on a stock image.
            if (!empty($p['own'])) $s += 20;
            // Effectively one use per photo. Softening this to -8 looked reasonable and was
            // measurably worse: the highest-scoring photo then won every scene, and the
            // pepper guide went from four of our own photographs to the same stock chilli
            // six times. Forcing variety is what surfaces the second and third best match.
            if (isset($used[$p['url']])) $s -= 100;
            if ($s > $bestScore) { $bestScore = $s; $bestUrl = $p['url']; }
        }

        if ($bestUrl === null) {
            foreach ($titleMatches as $u) {
                if (!isset($used[$u])) { $bestUrl = $u; break; }
            }
        }
        // Before reaching for a generic shot: the article's own photograph is the one image
        // known to match this subject, because every article is given one deliberately. A
        // field of rocket on a scene about a ZZ plant is worse than seeing the lead photo
        // twice — and that is exactly what the generic pool produced.
        // An incidental one-word match on a subject the catalogue does not cover is how a
        // houseplant video ends up in a vegetable field. Below that bar, the article's own
        // photo — the one image chosen for this subject on purpose — wins.
        if ($bestUrl !== null && $bestScore < 10 && $articleImage && $i > 1) $bestUrl = $articleImage;

        if ($bestUrl === null && $articleImage && $i > 1) $bestUrl = $articleImage;

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

    // In word mode the spoken line is drawn by ffmpeg, word by word, in time with the
    // narration. Everything static still comes from here — gradients, badge, watermark,
    // footer — but the headline and caption are left out so the two don't overlap.
    $wordMode = !empty($scene['wordMode']);

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

    // A panel behind the spoken words.
    //
    // In word mode ffmpeg draws each word as it is said, over whatever the photograph
    // happens to be — white letters with a black outline, floating. The one video on this
    // channel that has actually been watched puts its text on a dark block instead, and it
    // reads far better at thumbnail size. The words still arrive one at a time; they just
    // land on something now.
    if ($wordMode) {
        // Generous enough for the four lines the layout can produce, centred on the same
        // band (~900px) the static headline uses.
        $panelTop = 742;
        $panelBottom = 1024;
        $pad = 28;
        for ($y = $panelTop; $y <= $panelBottom; $y++) {
            // Soft top and bottom edges, flat through the middle: a hard rectangle edge on
            // a photograph looks like a mistake.
            $edge = min($y - $panelTop, $panelBottom - $y);
            $opacity = $edge < $pad ? 0.62 * ($edge / $pad) : 0.62;
            imageline($img, 0, $y, SG_W, $y, imagecolorallocatealpha($img, 0, 0, 0, (int) round(127 - $opacity * 127)));
        }
    }

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

    if (!$wordMode) {
        foreach ($hookLines as $line) {
            sg_outlined_text($img, $line, SG_W / 2, $hookY, $hookSize, $white, $black);
            $hookY += $lineHeight;
        }
    }

    // Subtitle strip. captionDisplay wins when a scene sets one, so the CTA scene's
    // phonetic "Σμαρτ Γκάρντεν" never leaks onto the screen.
    // Skipped on step scenes: there the narration is just "Πρώτον: <the bullet>" and the
    // bullet is already the headline, so the strip only reprinted the same sentence in
    // smaller type under itself.
    if ($step === 0 && !$wordMode) {
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
