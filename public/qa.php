<?php
// "Ρωτήστε τον Γεωπόνο" — reader Q&A.
//
// Flow: a visitor submits a question -> Gemini drafts an answer -> the draft sits in
// `pending` and is NOT publicly visible until a human approves it via ?action=admin.
// The moderation gate is deliberate, not an oversight: auto-publishing AI answers to
// arbitrary questions is exactly the "scaled content abuse" pattern Google's March 2026
// core update penalised. Nothing reaches the public list without a person approving it.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$STORE = __DIR__ . '/qa_questions.json';
$USAGE = __DIR__ . '/qa_usage.json';
$ADMIN_KEY = 'smartgarden_qa_a91f3d';

function qa_load($path) {
    if (!file_exists($path)) return array();
    $decoded = json_decode(@file_get_contents($path), true);
    return is_array($decoded) ? $decoded : array();
}

function qa_save($path, $data) {
    @file_put_contents($path, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function qa_fail($code, $message) {
    http_response_code($code);
    echo json_encode(array('success' => false, 'error' => $message), JSON_UNESCAPED_UNICODE);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$items = qa_load($STORE);

// ---------------------------------------------------------------- public list
if ($action === 'list') {
    $public = array();
    foreach ($items as $item) {
        if (!isset($item['status']) || $item['status'] !== 'approved') continue;
        $public[] = array(
            'id'        => $item['id'],
            'slug'      => $item['slug'],
            'question'  => $item['question'],
            'answer'    => $item['answer'],
            'askedBy'   => isset($item['askedBy']) ? $item['askedBy'] : '',
            'approvedAt'=> isset($item['approvedAt']) ? $item['approvedAt'] : '',
            'category'  => isset($item['category']) ? $item['category'] : '',
        );
    }
    usort($public, function ($a, $b) { return strcmp($b['approvedAt'], $a['approvedAt']); });
    echo json_encode(array('success' => true, 'count' => count($public), 'questions' => $public), JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------------------------------------------------------------- admin
if ($action === 'admin') {
    $key = isset($_GET['key']) ? $_GET['key'] : '';
    if (!hash_equals($ADMIN_KEY, $key)) qa_fail(401, 'Unauthorized');

    $op = isset($_GET['op']) ? $_GET['op'] : 'list';

    if ($op === 'list') {
        $pending = array();
        foreach ($items as $item) {
            if (isset($item['status']) && $item['status'] === 'pending') $pending[] = $item;
        }
        echo json_encode(array('success' => true, 'pending' => count($pending), 'questions' => $pending), JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = isset($_GET['id']) ? $_GET['id'] : '';
    if ($id === '') qa_fail(400, 'Missing id');

    $found = false;
    foreach ($items as $idx => $item) {
        if ($item['id'] !== $id) continue;
        $found = true;
        if ($op === 'approve') {
            // Allow the approver to replace the AI draft with their own wording.
            $body = json_decode(file_get_contents('php://input'), true);
            if (is_array($body) && isset($body['answer']) && trim($body['answer']) !== '') {
                $items[$idx]['answer'] = trim($body['answer']);
                $items[$idx]['editedByHuman'] = true;
            }
            $items[$idx]['status'] = 'approved';
            $items[$idx]['approvedAt'] = date('Y-m-d H:i:s');
        } elseif ($op === 'reject') {
            $items[$idx]['status'] = 'rejected';
        } else {
            qa_fail(400, 'Unknown op');
        }
        break;
    }
    if (!$found) qa_fail(404, 'Question not found');

    qa_save($STORE, $items);
    echo json_encode(array('success' => true, 'op' => $op, 'id' => $id), JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------------------------------------------------------------- submit
if ($_SERVER['REQUEST_METHOD'] !== 'POST') qa_fail(405, 'Method not allowed');

$clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
$now = time();
$usage = qa_load($USAGE);
$recent = isset($usage[$clientIp])
    ? array_values(array_filter($usage[$clientIp], function ($t) use ($now) { return $t > $now - 3600; }))
    : array();
if (count($recent) >= 5) qa_fail(429, 'Πολλές ερωτήσεις σε σύντομο διάστημα. Δοκιμάστε ξανά σε λίγο.');
$recent[] = $now;
$usage[$clientIp] = $recent;
foreach ($usage as $ip => $stamps) {
    $kept = array_values(array_filter($stamps, function ($t) use ($now) { return $t > $now - 3600; }));
    if (empty($kept)) { unset($usage[$ip]); } else { $usage[$ip] = $kept; }
}
qa_save($USAGE, $usage);

$body = json_decode(file_get_contents('php://input'), true);
$question = isset($body['question']) ? trim($body['question']) : '';
$askedBy  = isset($body['name']) ? trim(substr($body['name'], 0, 40)) : '';

if (mb_strlen($question, 'UTF-8') < 15) qa_fail(400, 'Η ερώτηση είναι πολύ σύντομη — περιγράψτε λίγο περισσότερο το πρόβλημα.');
if (mb_strlen($question, 'UTF-8') > 600) qa_fail(400, 'Η ερώτηση είναι πολύ μεγάλη (μέγιστο 600 χαρακτήρες).');

$geminiKey = getenv('GEMINI_API_KEY');
$answer = '';
if ($geminiKey) {
    $prompt = "Είσαι έμπειρος Έλληνας γεωπόνος και απαντάς σε ερώτηση αναγνώστη του SmartGarden.gr.\n\n"
        . "Ερώτηση: \"" . $question . "\"\n\n"
        . "Γράψε απάντηση 120-200 λέξεων στα Ελληνικά. Κανόνες:\n"
        . "1. Ξεκίνα με την ΑΜΕΣΗ απάντηση στην πρώτη πρόταση, χωρίς εισαγωγή.\n"
        . "2. Χρησιμοποίησε συγκεκριμένους αριθμούς (θερμοκρασίες, δοσολογίες, ημέρες, συχνότητα) αντί για γενικότητες.\n"
        . "3. Προσαρμογή στο ελληνικό/μεσογειακό κλίμα και σε καλλιέργεια σε γλάστρα/μπαλκόνι όπου ταιριάζει.\n"
        . "4. Αν η ερώτηση είναι ασαφής ή λείπουν κρίσιμα στοιχεία, πες ρητά τι χρειάζεται να διευκρινιστεί αντί να μαντέψεις.\n"
        . "5. Αν το ερώτημα δεν αφορά φυτά/κηπουρική, απάντησε μόνο: ΕΚΤΟΣ_ΘΕΜΑΤΟΣ\n"
        . "Γράψε μόνο την απάντηση, χωρίς τίτλο ή μετα-σχόλια.";

    $payload = json_encode(array(
        'contents' => array(array('parts' => array(array('text' => $prompt)))),
        'generationConfig' => array('temperature' => 0.4, 'maxOutputTokens' => 800),
    ));

    $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' . $geminiKey);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
        CURLOPT_TIMEOUT => 25,
    ));
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200 && $res) {
        $decoded = json_decode($res, true);
        if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
            $answer = trim($decoded['candidates'][0]['content']['parts'][0]['text']);
        }
    }
}

if (strpos($answer, 'ΕΚΤΟΣ_ΘΕΜΑΤΟΣ') !== false) {
    qa_fail(400, 'Η ερώτηση δεν φαίνεται να αφορά φυτά ή κηπουρική.');
}

// Slug from the question text, for the eventual public URL of the answer.
$slugBase = mb_strtolower(mb_substr($question, 0, 60, 'UTF-8'), 'UTF-8');
$translit = array(
    'α'=>'a','ά'=>'a','β'=>'v','γ'=>'g','δ'=>'d','ε'=>'e','έ'=>'e','ζ'=>'z','η'=>'i','ή'=>'i',
    'θ'=>'th','ι'=>'i','ί'=>'i','ϊ'=>'i','ΐ'=>'i','κ'=>'k','λ'=>'l','μ'=>'m','ν'=>'n','ξ'=>'x',
    'ο'=>'o','ό'=>'o','π'=>'p','ρ'=>'r','σ'=>'s','ς'=>'s','τ'=>'t','υ'=>'y','ύ'=>'y','ϋ'=>'y',
    'φ'=>'f','χ'=>'ch','ψ'=>'ps','ω'=>'o','ώ'=>'o',
);
$slug = strtr($slugBase, $translit);
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim($slug, '-');
if ($slug === '') $slug = 'erotisi';

$items[] = array(
    'id'        => 'qa-' . date('Ymd-His') . '-' . substr(md5(uniqid('', true)), 0, 6),
    'slug'      => $slug . '-' . date('Ymd'),
    'question'  => $question,
    'answer'    => $answer,
    'askedBy'   => $askedBy,
    'status'    => 'pending',
    'submittedAt' => date('Y-m-d H:i:s'),
    'aiDrafted' => $answer !== '',
);
qa_save($STORE, $items);

echo json_encode(array(
    'success' => true,
    'message' => 'Η ερώτησή σας καταχωρήθηκε. Απαντάται από γεωπόνο και δημοσιεύεται μόλις ελεγχθεί.',
), JSON_UNESCAPED_UNICODE);
