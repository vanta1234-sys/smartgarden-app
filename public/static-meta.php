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
require_once __DIR__ . '/ssr-lib.php';

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
        $description = $plant['name'] . ': γλάστρα ' . $plant['potLitres'] . ', pH ' . $plant['ph']
            . ', ' . mb_strtolower($plant['sun'], 'UTF-8') . ', αντοχή έως ' . $plant['minTempC']
            . '°C. Πότε σπέρνεται και το λάθος που το σκοτώνει.';
        $url = 'https://smartgarden.gr/fyta/' . rawurlencode($plant['slug']);
        // Share a real photograph of the plant where there is one, rather than the site's
        // generic default. Requires ssr-lib, which is loaded at the top of this file.
        $ownPhotos = sg_plant_photos($plant['slug']);
        if (count($ownPhotos)) $image = 'https://smartgarden.gr' . $ownPhotos[0]['file'];
    } else {
        $title = 'Βάση Δεδομένων Φυτών: Καλλιέργεια & Φροντίδα στο Ελληνικό Κλίμα | SmartGarden.gr';
        $description = 'Αναλυτικά δεδομένα καλλιέργειας για δεκάδες φυτά προσαρμοσμένα στο ελληνικό κλίμα: αντοχή στον παγετό, pH, μέγεθος γλάστρας, μήνες σποράς και το συχνότερο λάθος για κάθε φυτό.';
        $url = 'https://smartgarden.gr/fyta';
    }
} elseif ($route === 'xoma') {
    $title = 'Υπολογιστής Χώματος & Γλάστρας: Πόσα Λίτρα Χρειάζεστε | SmartGarden.gr';
    $description = 'Δωρεάν υπολογιστής: δώστε τις διαστάσεις της γλάστρας σας και τον τύπο φυτού και μάθετε ακριβώς πόσα λίτρα χώμα, περλίτη και κομπόστ χρειάζεστε.';
    $url = 'https://smartgarden.gr/xoma';
} elseif ($route === 'selini') {
    $title = 'Σεληνιακό Ημερολόγιο Κηπουρικής: Τι Φυτεύουμε στη Χάση & στη Γέμιση | SmartGarden.gr';
    $description = 'Φάση σελήνης σήμερα και τι λέει η ελληνική παράδοση για σπορά, φύτευση και κλάδεμα στη χάση και στη γέμιση — μαζί με το τι δείχνουν πραγματικά τα γεωπονικά δεδομένα.';
    $url = 'https://smartgarden.gr/selini';
} elseif ($route === 'rotiste') {
    $title = 'Ρωτήστε τον Γεωπόνο: Απαντήσεις σε Πραγματικές Ερωτήσεις Κηπουρικής | SmartGarden.gr';
    $description = 'Στείλτε την ερώτησή σας για φυτά, γλάστρες, ασθένειες ή πότισμα και πάρτε τεκμηριωμένη απάντηση. Δείτε απαντήσεις σε πραγματικές ερωτήσεις άλλων αναγνωστών.';
    $url = 'https://smartgarden.gr/rotiste';
} elseif ($route === 'privacy') {
    $title = 'Πολιτική Απορρήτου — SmartGarden.gr';
    $description = 'Τι δεδομένα συλλέγει το SmartGarden.gr, γιατί, πού καταλήγουν και πώς τα διαγράφετε. Newsletter, διάγνωση φυτού, cookies και δικαιώματα GDPR.';
    $url = 'https://smartgarden.gr/privacy';
} elseif ($route === 'terms') {
    $title = 'Όροι Χρήσης — SmartGarden.gr';
    $description = 'Οι όροι χρήσης του SmartGarden.gr: ενημερωτικός χαρακτήρας περιεχομένου, περιεχόμενο με βοήθεια AI, πνευματικά δικαιώματα και αποδεκτή χρήση.';
    $url = 'https://smartgarden.gr/terms';
} elseif ($route === 'pagetos') {
    $title = 'Ημερομηνίες Παγετού & Ασφαλής Φύτευση ανά Περιοχή στην Ελλάδα — SmartGarden.gr';
    $description = 'Πραγματικές ημερομηνίες πρώτου και τελευταίου παγετού για 50+ ελληνικές περιοχές, από 20 χρόνια μετεωρολογικών δεδομένων. Δείτε πότε μπορείτε με ασφάλεια να φυτέψετε ντομάτες, βασιλικό και άλλα ευαίσθητα φυτά στην περιοχή σας.';
    $url = 'https://smartgarden.gr/pagetos';
}

if ($title && $description) {
    $replacements = [
        '/<title>.*?<\/title>/s' => '<title>' . htmlspecialchars(sg_page_title($title), ENT_QUOTES) . '</title>',
        '/<meta name="description" content=".*?"/s' => '<meta name="description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<link rel="canonical" href=".*?"/s' => '<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:url" content=".*?"/s' => '<meta property="og:url" content="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:title" content=".*?"/s' => '<meta property="og:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta property="og:description" content=".*?"/s' => '<meta property="og:description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<meta property="og:image" content=".*?"/s' => '<meta property="og:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
        '/<meta name="twitter:title" content=".*?"/s' => '<meta name="twitter:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta name="twitter:description" content=".*?"/s' => '<meta name="twitter:description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<meta name="twitter:image" content=".*?"/s' => '<meta name="twitter:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
    ];
    foreach ($replacements as $pattern => $replacement) {
        $html = preg_replace($pattern, $replacement, $html, 1);
    }
}

// ---------------------------------------------------------------------------
// Server-rendered body.
//
// Meta tags alone left every one of these URLs serving a single character of text in an
// otherwise identical shell — the same fault that had Search Console filing 158 pages as
// "Duplicate: Google chose a different canonical". Each route below now renders something
// that is actually about that page, from data already on the server.

$articles = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
$articles = array_map('sg_repair_article', $articles);
$body = '';
$ld = null;
$home = 'https://smartgarden.gr/';

if ($route === 'home') {
    $body = '<h1>SmartGarden.gr — Οδηγοί Κηπουρικής για Μπαλκόνι &amp; Κήπο</h1>'
          . '<p>Ψηφιακό περιοδικό για το ελληνικό μπαλκόνι, τις γλάστρες, τον λαχανόκηπο και τον κήπο. '
          . 'Καθημερινοί οδηγοί βήμα-βήμα, ζωντανά μετεωρολογικά δεδομένα και υπολογισμός εξάτμισης (ET₀) '
          . 'για ' . count($articles) . ' θέματα καλλιέργειας στο ελληνικό κλίμα.</p>'
          . '<h2>Εργαλεία</h2><ul>'
          . '<li><a href="/xoma">Υπολογιστής χώματος και γλάστρας</a></li>'
          . '<li><a href="/pagetos">Ημερομηνίες παγετού ανά περιοχή</a></li>'
          . '<li><a href="/imerologio-sporas">Ημερολόγιο σποράς</a></li>'
          . '<li><a href="/klima-kipoy">Σύγκριση κλίματος</a></li>'
          . '<li><a href="/fyta">Βάση δεδομένων φυτών</a></li>'
          . '<li><a href="/selini">Σεληνιακό ημερολόγιο</a></li>'
          . '<li><a href="/rotiste">Ρωτήστε τον γεωπόνο</a></li>'
          . '</ul>'
          . sg_article_list($articles, 30, 'Πρόσφατα άρθρα');
    $ld = array(
        '@context' => 'https://schema.org', '@type' => 'WebSite',
        'name' => 'SmartGarden.gr', 'url' => $home, 'inLanguage' => 'el',
        'description' => 'Οδηγοί κηπουρικής, μπαλκονιού και λαχανόκηπου για το ελληνικό κλίμα.',
    );

} elseif ($route === 'kategoria' && $slug) {
    $inCat = array();
    $label = $slug;
    foreach ($articles as $a) {
        if (($a['category'] ?? '') === $slug) {
            $inCat[] = $a;
            // categoryLabel is {el, en}, not a string. Passing the array straight to
            // htmlspecialchars is a TypeError in PHP 8 — it took the category pages down
            // with a 500 the moment this shipped.
            $cl = $a['categoryLabel'] ?? null;
            if (is_array($cl)) {
                if (!empty($cl['el'])) $label = $cl['el'];
            } elseif (!empty($cl)) {
                $label = $cl;
            }
        }
    }
    $body = '<h1>' . sg_e($label) . '</h1>'
          . '<p>' . count($inCat) . ' οδηγοί στην κατηγορία «' . sg_e($label) . '» από το SmartGarden.gr.</p>'
          . sg_article_list($inCat, 50);

    // Two categories hold a single article each, which left those pages at ~330 characters
    // — thin enough that Google files them as "crawled, not indexed" and they never pay
    // back the crawl. Filling out a short category with the newest guides from elsewhere
    // gives the page something to say and the crawler somewhere to go.
    if (count($inCat) < 4) {
        $rest = array();
        foreach ($articles as $a) {
            if (($a['category'] ?? '') === $slug) continue;
            $rest[] = $a;
            if (count($rest) >= 12) break;
        }
        if (count($rest)) {
            $body .= '<nav>' . sg_article_list($rest, 12, 'Πρόσφατα από τις υπόλοιπες κατηγορίες') . '</nav>';
        }
    }
    $body .= '<p><a href="/">Όλοι οι οδηγοί του SmartGarden.gr</a> · <a href="/fyta">Βάση δεδομένων φυτών</a></p>';
    $ld = sg_breadcrumbs(array('Αρχική' => $home, $label => $home . 'kategoria/' . rawurlencode($slug)));

} elseif ($route === 'fyta') {
    $plants = json_decode((string) @file_get_contents(__DIR__ . '/plants.json'), true) ?: array();
    if (!$slug) {
        $body = '<h1>Βάση Δεδομένων Φυτών</h1><p>Απαιτήσεις καλλιέργειας για '
              . count($plants) . ' φυτά: ελάχιστη θερμοκρασία, ηλιοφάνεια και εύρος pH εδάφους.</p><ul>';
        foreach ($plants as $pl) {
            $body .= '<li><a href="/fyta/' . sg_e(rawurlencode($pl['slug'] ?? '')) . '">' . sg_e($pl['name'] ?? '')
                   . '</a> — <em>' . sg_e($pl['botanical'] ?? '') . '</em></li>';
        }
        $body .= '</ul>';
    } else {
        $plant = null;
        foreach ($plants as $pl) if (($pl['slug'] ?? '') === $slug) { $plant = $pl; break; }
        if ($plant) {
            $M = array('', 'Ιανουάριο', 'Φεβρουάριο', 'Μάρτιο', 'Απρίλιο', 'Μάιο', 'Ιούνιο',
                       'Ιούλιο', 'Αύγουστο', 'Σεπτέμβριο', 'Οκτώβριο', 'Νοέμβριο', 'Δεκέμβριο');
            $months = function ($nums) use ($M) {
                $out = array();
                foreach ((array) $nums as $n) if (isset($M[(int) $n])) $out[] = $M[(int) $n];
                return count($out) ? implode(', ', $out) : '';
            };
            $sow = $months($plant['sowMonths'] ?? array());
            $harvest = $months($plant['harvestMonths'] ?? array());
            $name = $plant['name'];

            $intro = 'Ο πλήρης οδηγός καλλιέργειας για ' . $name . ' (<em>' . sg_e($plant['botanical'] ?? '') . '</em>'
                   . (!empty($plant['family']) ? ', οικογένεια ' . sg_e($plant['family']) : '') . ') σε ελληνικό κλίμα: '
                   . 'πότε σπέρνουμε, τι γλάστρα χρειάζεται, πόσο νερό θέλει και ποιο είναι το λάθος που το σκοτώνει.';

            $rows = array(
                'Ηλιοφάνεια' => $plant['sun'] ?? '',
                'Πότισμα' => $plant['water'] ?? '',
                'Μέγεθος γλάστρας' => $plant['potLitres'] ?? '',
                'pH εδάφους' => $plant['ph'] ?? '',
                'Αντέχει έως' => isset($plant['minTempC']) ? $plant['minTempC'] . ' °C' : '',
                'Δυσκολία' => $plant['difficulty'] ?? '',
                'Σπορά / φύτευση' => $sow,
                'Συγκομιδή / ανθοφορία' => $harvest,
                'Κατηγορία' => $plant['categoryLabel'] ?? '',
            );
            $table = '<table><tbody>';
            foreach ($rows as $k => $v) {
                if ($v === '' || $v === null) continue;
                $table .= '<tr><th>' . sg_e($k) . '</th><td>' . sg_e($v) . '</td></tr>';
            }
            $table .= '</tbody></table>';

            $body = '<h1>' . sg_e($name) . ' — Οδηγός Καλλιέργειας</h1>'
                  . '<p>' . $intro . '</p>';

            // Our own photographs of this plant, where we have them.
            $plantPhotos = sg_plant_photos($slug);
            if (count($plantPhotos)) {
                $body .= '<h2>' . sg_e($name) . ' από τον κήπο μας</h2>';
                foreach ($plantPhotos as $i => $photo) {
                    $body .= '<figure><img src="' . sg_e($photo['file']) . '" alt="' . sg_e($photo['alt'])
                           . '" width="900" height="675" loading="' . ($i === 0 ? 'eager' : 'lazy')
                           . '" decoding="async"><figcaption>' . sg_e($photo['alt'])
                           . ' — δική μας φωτογραφία, Σεπτέμβριος 2026.</figcaption></figure>';
                }
            }

            $body .= '<h2>Απαιτήσεις με μια ματιά</h2>' . $table;

            if ($sow !== '') {
                $body .= '<h2>Πότε σπέρνουμε ' . sg_e($name) . '</h2>'
                       . '<p>Η σπορά ή φύτευση γίνεται ' . sg_e($sow) . '.'
                       . ($harvest !== '' ? ' Η συγκομιδή ξεκινά ' . sg_e($harvest) . '.' : '')
                       . (isset($plant['minTempC'])
                            ? ' Το φυτό αντέχει μέχρι τους ' . sg_e($plant['minTempC']) . ' °C, οπότε σε περιοχές με '
                            . 'όψιμο παγετό περιμένουμε — δες τις <a href="/pagetos">ημερομηνίες παγετού ανά περιοχή</a>.'
                            : '')
                       . '</p>';
            }
            if (!empty($plant['commonProblem'])) {
                $body .= '<h2>Το συνηθέστερο πρόβλημα</h2><p>' . sg_e($plant['commonProblem']) . '</p>';
            }
            if (!empty($plant['keyTip'])) {
                $body .= '<h2>Η συμβουλή που κάνει τη διαφορά</h2><p>' . sg_e($plant['keyTip']) . '</p>';
            }
            if (!empty($plant['companions']) && is_array($plant['companions'])) {
                $body .= '<h2>Καλές συντροφιές στη γλάστρα</h2><p>' . sg_e($name) . ' ταιριάζει με: '
                       . sg_e(implode(', ', $plant['companions'])) . '.</p>';
            }
            $body .= '<p><a href="/fyta">Όλα τα φυτά στη βάση δεδομένων</a> · '
                   . '<a href="/xoma">Υπολογιστής χώματος &amp; γλάστρας</a> · '
                   . '<a href="/imerologio-sporas">Ημερολόγιο σποράς</a></p>';

            // Articles that actually mention this plant, so the page links somewhere useful.
            $rel = array();
            $needle = mb_strtolower($name, 'UTF-8');
            foreach ($articles as $a) {
                $hay = mb_strtolower(($a['title']['el'] ?? '') . ' ' . ($a['summary']['el'] ?? ''), 'UTF-8');
                if (mb_strpos($hay, mb_substr($needle, 0, max(4, mb_strlen($needle) - 2), 'UTF-8')) !== false) $rel[] = $a;
            }
            if (count($rel)) $body .= sg_article_list($rel, 10, 'Σχετικοί οδηγοί');

            // Breadcrumbs plus the questions this page actually answers. The answers are the
            // page's own text, which is what Google requires of FAQ markup.
            $faq = array();
            if ($sow !== '') {
                $faq[] = array('Πότε σπέρνουμε ' . $name . ';',
                    'Η σπορά ή φύτευση γίνεται ' . $sow . ($harvest !== '' ? ', με συγκομιδή ' . $harvest : '') . '.');
            }
            if (!empty($plant['commonProblem'])) {
                $faq[] = array('Ποιο είναι το συνηθέστερο πρόβλημα στη/στον ' . $name . ';', $plant['commonProblem']);
            }
            if (!empty($plant['potLitres'])) {
                $faq[] = array('Τι γλάστρα χρειάζεται ' . $name . ';',
                    'Γλάστρα ' . $plant['potLitres'] . ', με pH εδάφους ' . ($plant['ph'] ?? '6.0-7.0')
                    . ' και ' . mb_strtolower($plant['water'] ?? 'μέτριο', 'UTF-8') . ' πότισμα.');
            }
            $ld = array(sg_breadcrumbs(array(
                'Αρχική' => $home, 'Φυτά' => $home . 'fyta',
                $name => $home . 'fyta/' . rawurlencode($slug),
            )));
            if (count($faq)) {
                $ld[] = array(
                    '@context' => 'https://schema.org', '@type' => 'FAQPage',
                    'mainEntity' => array_map(function ($q) {
                        return array('@type' => 'Question', 'name' => $q[0],
                            'acceptedAnswer' => array('@type' => 'Answer', 'text' => $q[1]));
                    }, $faq),
                );
            }
        }
    }

} elseif ($title) {
    // The remaining tool and hub pages already have a hand-written title and description
    // upstairs; promoting those into real body copy beats leaving the page blank.
    $body = '<h1>' . sg_e(preg_replace('/\s*[|—]\s*SmartGarden\.gr\s*$/u', '', $title)) . '</h1>'
          . '<p>' . sg_e($description) . '</p>'
          . sg_article_list($articles, 12, 'Πρόσφατα από το SmartGarden.gr');
}

if ($body !== '') $html = sg_inject_body($html, $body, $ld);

header('Content-Type: text/html; charset=utf-8');
echo $html;
