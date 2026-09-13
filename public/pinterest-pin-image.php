<?php
/**
 * SmartGarden.gr - Generates a Pinterest-optimized branded pin image on the fly.
 * Pinterest's "media_source: image_url" (see pinterest-publish.php) fetches whatever
 * this URL returns, so there's no need to pre-render/store files anywhere — this IS
 * the image, generated fresh from the article's own data each time it's requested.
 *
 * GET /pinterest-pin-image.php?articleId=<id>  -> 1000x1500 JPEG (Pinterest's
 * recommended 2:3 vertical ratio for 2026), source photo + title text overlay +
 * SmartGarden.gr wordmark. No "Idea Pins"/video here on purpose — Pinterest retired
 * those in 2024; static image pins are the current format (see the researched plan
 * in the seo_traffic_improvements memory).
 */

header('Content-Type: image/jpeg');

function pinImageFail($message) {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo $message;
    exit;
}

$articleId = isset($_GET['articleId']) ? trim($_GET['articleId']) : '';
if ($articleId === '') {
    pinImageFail('Missing articleId');
}

$articlesPath = __DIR__ . '/latest_articles.json';
if (!file_exists($articlesPath)) {
    pinImageFail('latest_articles.json not found');
}
$articles = json_decode(file_get_contents($articlesPath), true);
$article = null;
foreach ($articles as $a) {
    if (($a['id'] ?? '') === $articleId) {
        $article = $a;
        break;
    }
}
if (!$article) {
    pinImageFail('Article not found: ' . $articleId);
}

$title = $article['title']['el'] ?? (is_string($article['title'] ?? null) ? $article['title'] : 'SmartGarden.gr');
$sourceImageUrl = $article['image'] ?? '';
if (!$sourceImageUrl) {
    pinImageFail('Article has no image');
}

// Pinterest's own current guidance: 1000x1500 (2:3), the "collage"/static-image
// format that replaced Idea Pins.
$canvasWidth = 1000;
$canvasHeight = 1500;

$fontPath = __DIR__ . '/fonts/NotoSans-Variable.ttf';
$hasFont = file_exists($fontPath);

// --- Fetch and decode the source photo ---
$imgData = @file_get_contents($sourceImageUrl . (strpos($sourceImageUrl, '?') !== false ? '&' : '?') . 'w=1200&auto=format&fit=crop&q=80');
if (!$imgData) {
    pinImageFail('Could not fetch source image');
}
$source = @imagecreatefromstring($imgData);
if (!$source) {
    pinImageFail('Could not decode source image');
}
$srcW = imagesx($source);
$srcH = imagesy($source);

$canvas = imagecreatetruecolor($canvasWidth, $canvasHeight);

// --- Cover-fit crop the source photo onto the canvas (same "cover" logic used
// client-side in TikTokStudio.tsx's Ken-Burns renderer, adapted for a static frame) ---
$scale = max($canvasWidth / $srcW, $canvasHeight / $srcH);
$destW = (int) round($srcW * $scale);
$destH = (int) round($srcH * $scale);
$destX = (int) round(($canvasWidth - $destW) / 2);
$destY = (int) round(($canvasHeight - $destH) / 2);
imagecopyresampled($canvas, $source, $destX, $destY, 0, 0, $destW, $destH, $srcW, $srcH);
imagedestroy($source);

// --- Bottom gradient overlay for text legibility (GD has no native gradient
// fill, so approximate one with one filled rectangle per pixel row — chunked
// steps left a visible seam/banding pattern between rows, this doesn't). ---
$overlayStart = (int) round($canvasHeight * 0.42);
$overlayRange = $canvasHeight - $overlayStart;
for ($y = $overlayStart; $y < $canvasHeight; $y++) {
    $t = ($y - $overlayStart) / $overlayRange;
    $rowAlpha = 127 - (int) round(115 * $t); // more opaque near the bottom
    $black = imagecolorallocatealpha($canvas, 0, 0, 0, max(0, min(127, $rowAlpha)));
    imageline($canvas, 0, $y, $canvasWidth, $y, $black);
}
// Solid strip at the very bottom for the wordmark to sit on reliably.
$solidBlack = imagecolorallocatealpha($canvas, 0, 0, 0, 40);
imagefilledrectangle($canvas, 0, $canvasHeight - 90, $canvasWidth, $canvasHeight, $solidBlack);

$white = imagecolorallocate($canvas, 255, 255, 255);
$black = imagecolorallocate($canvas, 0, 0, 0);

// Draws text with a soft black outline (GD has no native stroke, so this offsets
// the same string in a ring of positions first) — same technique as the client-side
// canvas renderer's drawOutlinedText, adapted for GD.
function pinDrawOutlinedText($canvas, $fontPath, $hasFont, $size, $x, $y, $text, $fg, $outline) {
    if ($hasFont) {
        foreach ([[-2,-2],[2,-2],[-2,2],[2,2],[0,-2],[0,2],[-2,0],[2,0]] as $off) {
            imagettftext($canvas, $size, 0, $x + $off[0], $y + $off[1], $outline, $fontPath, $text);
        }
        imagettftext($canvas, $size, 0, $x, $y, $fg, $fontPath, $text);
    } else {
        // Fallback if the font file is ever missing on the live server — GD's
        // built-in bitmap font doesn't support Greek, but this keeps the endpoint
        // from hard-failing (renders the photo + overlay with no title instead).
        imagestring($canvas, 5, $x, $y, '(font missing)', $fg);
    }
}

// Word-wrap the title against the canvas width using the real font metrics.
function pinWrapText($fontPath, $hasFont, $size, $maxWidth, $text) {
    if (!$hasFont) return [$text];
    $words = preg_split('/\s+/u', trim($text));
    $lines = [];
    $current = '';
    foreach ($words as $word) {
        $test = $current === '' ? $word : ($current . ' ' . $word);
        $box = imagettfbbox($size, 0, $fontPath, $test);
        $w = $box[2] - $box[0];
        if ($w > $maxWidth && $current !== '') {
            $lines[] = $current;
            $current = $word;
        } else {
            $current = $test;
        }
    }
    if ($current !== '') $lines[] = $current;
    return $lines;
}

$titleFontSize = 44;
$maxTextWidth = $canvasWidth - 120;
$titleLines = pinWrapText($fontPath, $hasFont, $titleFontSize, $maxTextWidth, $title);
$titleLines = array_slice($titleLines, 0, 5); // cap runaway-long titles

$lineHeight = (int) round($titleFontSize * 1.35);
$totalTextHeight = count($titleLines) * $lineHeight;
$textStartY = $canvasHeight - 140 - $totalTextHeight + $titleFontSize;

foreach ($titleLines as $i => $line) {
    $box = $hasFont ? imagettfbbox($titleFontSize, 0, $fontPath, $line) : [0,0,0,0,0,0,0,0];
    $lineW = $box[2] - $box[0];
    $x = (int) round(($canvasWidth - $lineW) / 2);
    $y = $textStartY + $i * $lineHeight;
    pinDrawOutlinedText($canvas, $fontPath, $hasFont, $titleFontSize, $x, $y, $line, $white, $black);
}

// SmartGarden.gr wordmark, bottom strip.
$wordmarkSize = 22;
$wordmark = 'smartgarden.gr';
if ($hasFont) {
    $wmBox = imagettfbbox($wordmarkSize, 0, $fontPath, $wordmark);
    $wmW = $wmBox[2] - $wmBox[0];
    imagettftext($canvas, $wordmarkSize, 0, (int) round(($canvasWidth - $wmW) / 2), $canvasHeight - 35, $white, $fontPath, $wordmark);
}

imagejpeg($canvas, null, 88);
imagedestroy($canvas);
