<?php
/**
 * SmartGarden.gr - Creates the site's Pinterest board taxonomy (one board per site
 * category, so each board's pins link to a landing page that already exists at
 * /kategoria/<slug>). Idempotent: boards that already exist are left alone, so this
 * can be re-run safely.
 *
 * Board names are deliberately keyword-specific rather than generic — Pinterest's own
 * guidance is that a descriptive board name ranks meaningfully better than a vague one.
 *
 * URL: https://smartgarden.gr/pinterest-create-boards.php?key=<cron key>
 * Returns the category_slug => board_id map that cron-publish.php needs for auto-pinning.
 */

header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$providedKey = isset($_GET['key']) ? $_GET['key'] : '';
if (!in_array($providedKey, $VALID_KEYS)) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'error' => 'Unauthorized'), JSON_UNESCAPED_UNICODE);
    exit;
}

$tokensPath = __DIR__ . '/pinterest_tokens.json';
if (!file_exists($tokensPath)) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'connected' => false, 'error' => 'Pinterest not connected. Visit /pinterest-auth-login.php'), JSON_UNESCAPED_UNICODE);
    exit;
}
$tokens = json_decode(file_get_contents($tokensPath), true);
$accessToken = isset($tokens['access_token']) ? $tokens['access_token'] : '';
if (!$accessToken) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'error' => 'No access token stored'), JSON_UNESCAPED_UNICODE);
    exit;
}

$boards = array(
    array(
        'category_slug' => 'balcony',
        'name' => 'Κηπουρική Μπαλκονιού & Γλάστρες',
        'description' => 'Καλλιέργεια σε μπαλκόνι και γλάστρες στο ελληνικό κλίμα: επιλογή γλάστρας, υπόστρωμα, πότισμα, φυτά για ήλιο και σκιά. Πρακτικοί οδηγοί βήμα-βήμα.',
    ),
    array(
        'category_slug' => 'plant_care',
        'name' => 'Φροντίδα Φυτών & Κλάδεμα',
        'description' => 'Κλάδεμα, λίπανση, μεταφύτευση και βιολογική φυτοπροστασία. Διάγνωση συμπτωμάτων, τροφοπενίες και αντιμετώπιση εχθρών χωρίς χημικά.',
    ),
    array(
        'category_slug' => 'vegetables',
        'name' => 'Καλλιέργεια Λαχανικών σε Γλάστρα',
        'description' => 'Ντομάτα, πιπεριά, μελιτζάνα, μαρούλι και λαχανικά σε δοχείο. Μέγεθος γλάστρας, θρέψη, υποστύλωση και συγκομιδή σε μικρό χώρο.',
    ),
    array(
        'category_slug' => 'vegetable_garden',
        'name' => 'Λαχανόκηπος & Υπερυψωμένα Παρτέρια',
        'description' => 'Raised beds, Hugelkultur, συγκαλλιέργεια και σχεδιασμός λαχανόκηπου. Δομή εδάφους, αμειψισπορά και εποχιακός προγραμματισμός.',
    ),
    array(
        'category_slug' => 'irrigation_iot',
        'name' => 'Έξυπνο Πότισμα & IoT Κήπου',
        'description' => 'Αυτόματο πότισμα, στάγδην άρδευση, αισθητήρες εδάφους και προγραμματιστές. Υπολογισμός αναγκών νερού με βάση την εξατμισοδιαπνοή.',
    ),
    array(
        'category_slug' => 'robotic_mowers',
        'name' => 'Ρομποτικά Χλοοκοπτικά',
        'description' => 'Ρομποτικά χλοοκοπτικά χωρίς περιμετρικό καλώδιο: RTK-GPS, LiDAR, AI vision. Σύγκριση, εγκατάσταση και συντήρηση για ελληνικούς κήπους.',
    ),
    array(
        'category_slug' => 'hydroponics',
        'name' => 'Υδροπονία στο Σπίτι',
        'description' => 'Υδροπονικά συστήματα για σπίτι και μπαλκόνι: θρεπτικό διάλυμα, pH, αγωγιμότητα EC και επιλογή φυτών χωρίς χώμα.',
    ),
);

// Existing boards first, so re-running doesn't create duplicates.
$ch = curl_init('https://api.pinterest.com/v5/boards?page_size=100');
curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $accessToken),
));
$listResp = json_decode(curl_exec($ch), true);
curl_close($ch);

$existing = array();
if (isset($listResp['items']) && is_array($listResp['items'])) {
    foreach ($listResp['items'] as $b) {
        if (isset($b['name'])) $existing[$b['name']] = $b['id'];
    }
}

$map = array();
$created = array();
$skipped = array();
$errors = array();

foreach ($boards as $board) {
    if (isset($existing[$board['name']])) {
        $map[$board['category_slug']] = $existing[$board['name']];
        $skipped[] = $board['name'];
        continue;
    }

    $ch = curl_init('https://api.pinterest.com/v5/boards');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ),
        CURLOPT_POSTFIELDS => json_encode(array(
            'name' => $board['name'],
            'description' => $board['description'],
            'privacy' => 'PUBLIC',
        ), JSON_UNESCAPED_UNICODE),
    ));
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($status >= 200 && $status < 300 && !empty($data['id'])) {
        $map[$board['category_slug']] = $data['id'];
        $created[] = $board['name'];
    } else {
        $errors[] = array('board' => $board['name'], 'status' => $status, 'response' => $data ? $data : $resp);
    }
}

// Persist the map so cron-publish.php can pin without re-listing boards on every run.
if ($map) {
    file_put_contents(__DIR__ . '/pinterest_boards.json', json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

echo json_encode(array(
    'success' => empty($errors),
    'created' => $created,
    'already_existed' => $skipped,
    'errors' => $errors,
    'category_to_board_id' => $map,
), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
