<?php
/**
 * SmartGarden.gr - Server-side meta tags for the app's other client-only pages
 * (category hubs, author bio, planting calendar, climate comparison). Same
 * problem/fix as article.php: social crawlers don't execute JS, so without
 * this every shared link to these pages showed the generic homepage preview.
 */

$route = $_GET['route'] ?? '';
$slug = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['slug'] ?? '');

$indexPath = __DIR__ . '/index.html';
$html = file_exists($indexPath) ? file_get_contents($indexPath) : false;
if (!$html) {
    http_response_code(500);
    echo 'Site build not found.';
    exit;
}

$defaultImage = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
$title = null;
$description = null;
$url = 'https://smartgarden.gr/';
$image = $defaultImage;

if ($route === 'kategoria' && $slug) {
    $articlesPath = __DIR__ . '/latest_articles.json';
    $categoryLabel = $slug;
    $count = 0;
    $firstImage = null;
    if (file_exists($articlesPath)) {
        $articles = json_decode(file_get_contents($articlesPath), true);
        if (is_array($articles)) {
            foreach ($articles as $a) {
                if (($a['category'] ?? '') === $slug) {
                    $count++;
                    if (!$firstImage) {
                        $categoryLabel = $a['categoryLabel']['el'] ?? $slug;
                        $firstImage = $a['image'] ?? null;
                    }
                }
            }
        }
    }
    $title = $categoryLabel . ' — Οδηγοί & Άρθρα | SmartGarden.gr';
    $description = 'Όλοι οι οδηγοί SmartGarden.gr για ' . $categoryLabel . ': ' . $count . ' επιστημονικά άρθρα κηπουρικής για το ελληνικό κλίμα.';
    $url = 'https://smartgarden.gr/kategoria/' . rawurlencode($slug);
    if ($firstImage) $image = $firstImage;
} elseif ($route === 'syntaktis') {
    $title = 'Κώστας Αναστασιάδης — Γεωπόνος M.Sc. & Smart Farming Specialist | SmartGarden.gr';
    $description = 'Βιογραφικό & άρθρα του Κώστα Αναστασιάδη, Γεωπόνου M.Sc. & Smart Farming Specialist στο SmartGarden.gr.';
    $url = 'https://smartgarden.gr/syntaktis';
} elseif ($route === 'imerologio-sporas') {
    $title = 'Ημερολόγιο Σποράς & Εργασιών Κήπου — SmartGarden.gr';
    $description = 'Τι σπέρνουμε, τι κλαδεύουμε και τι λιπαίνουμε κάθε μήνα στο ελληνικό μπαλκόνι & κήπο. Πλήρες ημερολόγιο εργασιών για όλο το χρόνο.';
    $url = 'https://smartgarden.gr/imerologio-sporas';
} elseif ($route === 'klima-kipoy') {
    $title = 'Ζωντανή Σύγκριση Εξατμισοδιαπνοής (ET₀) Ελληνικών Πόλεων — SmartGarden.gr';
    $description = 'Ζωντανά δεδομένα εξατμισοδιαπνοής (ET₀), θερμοκρασίας και υγρασίας για 15 ελληνικές πόλεις — δείτε ποια περιοχή έχει τη μεγαλύτερη ανάγκη ποτίσματος σήμερα.';
    $url = 'https://smartgarden.gr/klima-kipoy';
} elseif ($route === 'fyta') {
    // /fyta and /fyta/<slug>. Plant data is mirrored into plants.json from the TS source
    // (src/data/plantDatabase.ts) precisely so this crawler-facing path can read it.
    $plantSlug = isset($_GET['slug']) ? $_GET['slug'] : '';
    $plant = null;
    if ($plantSlug !== '') {
        $plantsRaw = @file_get_contents(__DIR__ . '/plants.json');
        $plants = $plantsRaw ? json_decode($plantsRaw, true) : array();
        if (is_array($plants)) {
            foreach ($plants as $p) {
                if (isset($p['slug']) && $p['slug'] === $plantSlug) { $plant = $p; break; }
            }
        }
    }
    if ($plant) {
        $title = $plant['name'] . ' (' . $plant['botanical'] . '): Καλλιέργεια & Φροντίδα στην Ελλάδα | SmartGarden.gr';
        $description = $plant['name'] . ' (' . $plant['botanical'] . '): αντοχή στο κρύο έως ' . $plant['minTempC']
            . '°C, ιδανικό pH ' . $plant['ph'] . ', ' . mb_strtolower($plant['sun'], 'UTF-8')
            . '. Πότε φυτεύεται στην περιοχή σας και ποιο είναι το συχνότερο λάθος.';
        $url = 'https://smartgarden.gr/fyta/' . rawurlencode($plant['slug']);
    } else {
        $title = 'Βάση Δεδομένων Φυτών: Καλλιέργεια & Φροντίδα στο Ελληνικό Κλίμα | SmartGarden.gr';
        $description = 'Αναλυτικά δεδομένα καλλιέργειας για δεκάδες φυτά προσαρμοσμένα στο ελληνικό κλίμα: αντοχή στον παγετό, pH, μέγεθος γλάστρας, μήνες σποράς και το συχνότερο λάθος για κάθε φυτό.';
        $url = 'https://smartgarden.gr/fyta';
    }
} elseif ($route === 'rotiste') {
    $title = 'Ρωτήστε τον Γεωπόνο: Απαντήσεις σε Πραγματικές Ερωτήσεις Κηπουρικής | SmartGarden.gr';
    $description = 'Στείλτε την ερώτησή σας για φυτά, γλάστρες, ασθένειες ή πότισμα και πάρτε τεκμηριωμένη απάντηση. Δείτε απαντήσεις σε πραγματικές ερωτήσεις άλλων αναγνωστών.';
    $url = 'https://smartgarden.gr/rotiste';
} elseif ($route === 'pagetos') {
    $title = 'Ημερομηνίες Παγετού & Ασφαλής Φύτευση ανά Περιοχή στην Ελλάδα — SmartGarden.gr';
    $description = 'Πραγματικές ημερομηνίες πρώτου και τελευταίου παγετού για 50+ ελληνικές περιοχές, από 20 χρόνια μετεωρολογικών δεδομένων. Δείτε πότε μπορείτε με ασφάλεια να φυτέψετε ντομάτες, βασιλικό και άλλα ευαίσθητα φυτά στην περιοχή σας.';
    $url = 'https://smartgarden.gr/pagetos';
}

if ($title && $description) {
    $replacements = [
        '/<title>.*?<\/title>/s' => '<title>' . htmlspecialchars($title, ENT_QUOTES) . '</title>',
        '/<meta name="description" content=".*?"/s' => '<meta name="description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<link rel="canonical" href=".*?"/s' => '<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:url" content=".*?"/s' => '<meta property="og:url" content="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:title" content=".*?"/s' => '<meta property="og:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta property="og:description" content=".*?"/s' => '<meta property="og:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<meta property="og:image" content=".*?"/s' => '<meta property="og:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
        '/<meta name="twitter:title" content=".*?"/s' => '<meta name="twitter:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta name="twitter:description" content=".*?"/s' => '<meta name="twitter:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<meta name="twitter:image" content=".*?"/s' => '<meta name="twitter:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
    ];
    foreach ($replacements as $pattern => $replacement) {
        $html = preg_replace($pattern, $replacement, $html, 1);
    }
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
