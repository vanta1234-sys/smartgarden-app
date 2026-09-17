<?php
/**
 * SmartGarden.gr - Where the two AdSense slot IDs live.
 *
 * The IDs used to be compiled into the bundle (src/config/ads.ts), which meant that adding
 * them needed a build and a deploy — so the site could not start earning until someone was
 * at a machine with the repo. They are stored here instead and inlined into every page, so
 * pasting them on this page turns the ads on immediately.
 *
 * URL: /ads-admin.php?key=<cron key>
 */

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$key = isset($_GET['key']) ? $_GET['key'] : (isset($_POST['key']) ? $_POST['key'] : '');
if (!in_array($key, $VALID_KEYS, true)) {
    http_response_code(401);
    echo 'Unauthorized';
    exit;
}

$path = __DIR__ . '/ads-slots.json';
$slots = json_decode((string) @file_get_contents($path), true);
if (!is_array($slots)) $slots = array('articleTop' => '', 'articleEnd' => '');
$saved = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // A slot id is a plain number from the AdSense snippet. Anything else is a paste
    // mistake, and rejecting it here beats shipping a broken <ins> to every reader.
    $top = preg_replace('/\D/', '', (string) ($_POST['articleTop'] ?? ''));
    $end = preg_replace('/\D/', '', (string) ($_POST['articleEnd'] ?? ''));
    if (($top !== '' && strlen($top) < 8) || ($end !== '' && strlen($end) < 8)) {
        $error = 'Ένα slot ID είναι ~10 ψηφία. Έλεγξε την επικόλληση.';
    } else {
        $slots = array('articleTop' => $top, 'articleEnd' => $end);
        @file_put_contents($path, json_encode($slots, JSON_PRETTY_PRINT));
        $saved = true;
    }
}

header('Content-Type: text/html; charset=utf-8');
$e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
?><!doctype html>
<html lang="el"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>SmartGarden.gr — AdSense slots</title>
<style>
 body{font-family:system-ui,sans-serif;margin:0;background:#FBF6EC;color:#14301C}
 .wrap{max-width:640px;margin:0 auto;padding:28px 20px 60px}
 h1{font-size:24px;margin:0 0 6px}.sub{color:#5b6b5f;font-size:14px;margin-bottom:22px}
 .card{background:#fff;border:1px solid #e2ddd0;border-radius:14px;padding:20px;margin-bottom:16px}
 label{display:block;font-weight:700;font-size:13px;margin:14px 0 6px}
 input,button{font:inherit;padding:10px 12px;border-radius:9px;border:1px solid #cfc9bb;width:100%;box-sizing:border-box}
 button{background:#2E6B3A;color:#fff;border:none;font-weight:700;margin-top:18px;cursor:pointer}
 .ok{background:#e8f5ea;border:1px solid #9ccfa8;padding:10px 12px;border-radius:9px;margin-bottom:16px}
 .err{background:#fdeceb;border:1px solid #e5a9a4;padding:10px 12px;border-radius:9px;margin-bottom:16px}
 ol{padding-left:20px;line-height:1.7;font-size:14px}code{background:#f2eee3;padding:1px 5px;border-radius:5px}
 .state{font-size:13px;color:#5b6b5f;margin-top:10px}
</style></head><body><div class="wrap">
<h1>AdSense slots</h1>
<div class="sub">Δύο μονάδες μέσα στο κείμενο του άρθρου. Κενό πεδίο = δεν εμφανίζεται τίποτα.</div>

<?php if ($saved): ?><div class="ok">Αποθηκεύτηκε. Ισχύει αμέσως — δεν χρειάζεται deploy.</div><?php endif; ?>
<?php if ($error): ?><div class="err"><?= $e($error) ?></div><?php endif; ?>

<div class="card">
  <strong>Πού τα βρίσκεις</strong>
  <ol>
    <li>AdSense → <em>Ads</em> → <em>By ad unit</em> → <em>Display ads</em></li>
    <li>Όνομα π.χ. <code>article-top</code>, τύπος <em>Responsive</em>, <em>Create</em></li>
    <li>Στο snippet που εμφανίζεται, αντίγραψε <strong>μόνο</strong> τον αριθμό του
        <code>data-ad-slot="..."</code></li>
    <li>Επανάλαβε για μια δεύτερη μονάδα, π.χ. <code>article-end</code></li>
  </ol>
</div>

<form method="post" class="card">
  <input type="hidden" name="key" value="<?= $e($key) ?>">
  <label>Πάνω στο άρθρο (μετά τα βασικά σημεία)</label>
  <input name="articleTop" value="<?= $e($slots['articleTop'] ?? '') ?>" placeholder="π.χ. 1234567890" inputmode="numeric">
  <label>Τέλος άρθρου (πριν τις ερωτήσεις)</label>
  <input name="articleEnd" value="<?= $e($slots['articleEnd'] ?? '') ?>" placeholder="π.χ. 0987654321" inputmode="numeric">
  <button type="submit">Αποθήκευση</button>
  <div class="state">Τώρα:
    πάνω <?= ($slots['articleTop'] ?? '') !== '' ? '<strong>ενεργό</strong>' : 'κενό' ?>,
    τέλος <?= ($slots['articleEnd'] ?? '') !== '' ? '<strong>ενεργό</strong>' : 'κενό' ?>.
  </div>
</form>
</div></body></html>
