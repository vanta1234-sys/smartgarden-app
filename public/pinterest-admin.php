<?php
/**
 * SmartGarden.gr - Pinterest admin tool.
 *
 * Two jobs:
 *  1. A real manual control: pick a published article, pick a board, create the Pin.
 *  2. It makes the API usage *visible* — the request that goes out and the raw response
 *     that comes back are printed on screen, which is what Pinterest's Standard-access
 *     review asks a demo video to show ("show your API usage, process, and results",
 *     not just UI widgets).
 *
 * URL: /pinterest-admin.php?key=<cron key>[&sandbox=1]
 */

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$key = isset($_GET['key']) ? $_GET['key'] : '';
if (!in_array($key, $VALID_KEYS)) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Unauthorized';
    exit;
}

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';
$apiBase = $isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';

if ($isSandbox) {
    $accessToken = getenv('PINTEREST_SANDBOX_TOKEN') ?: '';
    $connectedLabel = 'Sandbox environment (' . $apiBase . ')';
} else {
    $tokensPath = __DIR__ . '/pinterest_tokens.json';
    $tokens = file_exists($tokensPath) ? json_decode(file_get_contents($tokensPath), true) : array();
    $accessToken = isset($tokens['access_token']) ? $tokens['access_token'] : '';
    $connectedLabel = 'Production (' . $apiBase . ') — OAuth token from pinterest_tokens.json';
}

function apiCall($method, $url, $token, $body = null) {
    $ch = curl_init($url);
    $opts = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token, 'Content-Type: application/json'),
    );
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
    }
    curl_setopt_array($ch, $opts);
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array('status' => $status, 'body' => $resp);
}

$articles = json_decode(@file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
$boardsResult = $accessToken ? apiCall('GET', $apiBase . '/v5/boards?page_size=50', $accessToken) : null;
$boards = array();
if ($boardsResult) {
    $decoded = json_decode($boardsResult['body'], true);
    if (isset($decoded['items'])) $boards = $decoded['items'];
}

$action = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['articleId'], $_POST['boardId'])) {
    $article = null;
    foreach ($articles as $a) {
        if (($a['id'] ?? '') === $_POST['articleId']) { $article = $a; break; }
    }
    if ($article) {
        $title = $article['title']['el'] ?? '';
        $summary = $article['summary']['el'] ?? '';
        $payload = array(
            'board_id' => $_POST['boardId'],
            'title' => mb_substr($title, 0, 100),
            'description' => mb_substr(trim($summary) . ' Πλήρης οδηγός στο SmartGarden.gr.', 0, 500),
            'link' => 'https://smartgarden.gr/article/' . rawurlencode($article['slug']),
            'media_source' => array(
                'source_type' => 'image_url',
                'url' => 'https://smartgarden.gr/pinterest-pin-image.php?articleId=' . rawurlencode($article['id']),
            ),
        );
        $result = apiCall('POST', $apiBase . '/v5/pins', $accessToken, $payload);
        $decoded = json_decode($result['body'], true);
        $action = array(
            'endpoint' => 'POST ' . $apiBase . '/v5/pins',
            'request' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'status' => $result['status'],
            'response' => json_encode($decoded ?: $result['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'pinId' => isset($decoded['id']) ? $decoded['id'] : null,
            'articleId' => $article['id'],
        );
    }
}
?>
<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartGarden.gr — Pinterest API</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #FBF6EC; color: #14301C; }
  .wrap { max-width: 1000px; margin: 0 auto; padding: 28px 20px 60px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .sub { color: #5b6b5f; margin-bottom: 22px; font-size: 14px; }
  .card { background: #fff; border: 1px solid #e2ddd0; border-radius: 14px; padding: 20px; margin-bottom: 18px; }
  label { display: block; font-weight: 700; font-size: 13px; margin: 14px 0 6px; }
  select, button { font: inherit; padding: 10px 12px; border-radius: 9px; border: 1px solid #cfc9bb; width: 100%; background:#fff; }
  button { background: #2E6B3A; color: #fff; border: none; font-weight: 700; cursor: pointer; margin-top: 18px; }
  pre { background: #14301C; color: #d7f0dc; padding: 14px; border-radius: 10px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
  .ok { color: #2E6B3A; font-weight: 700; }
  .bad { color: #b3261e; font-weight: 700; }
  .env { display:inline-block; background:#eef3ec; border:1px solid #cfe0d2; padding:4px 10px; border-radius:99px; font-size:12px; }
  img.preview { width: 180px; border-radius: 10px; border: 1px solid #e2ddd0; }
  .row { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
</style>
</head>
<body>
<div class="wrap">
  <h1>SmartGarden.gr — Pinterest API</h1>
  <div class="sub">Δημιουργία Pin από δημοσιευμένο άρθρο. <span class="env"><?= htmlspecialchars($connectedLabel) ?></span></div>

  <div class="card">
    <strong>1. Σύνδεση</strong>
    <p style="margin:8px 0 0;font-size:14px;">
      <?php if ($accessToken): ?>
        <span class="ok">✓ Συνδεδεμένο</span> — <?= count($boards) ?> boards διαθέσιμα μέσω <code>GET /v5/boards</code>
      <?php else: ?>
        <span class="bad">✗ Μη συνδεδεμένο</span> — <a href="/pinterest-auth-login.php">σύνδεση μέσω OAuth</a>
      <?php endif; ?>
    </p>
  </div>

  <form method="post" class="card">
    <strong>2. Δημιουργία Pin</strong>
    <label for="articleId">Άρθρο</label>
    <select name="articleId" id="articleId" required>
      <?php foreach (array_slice($articles, 0, 40) as $a): ?>
        <option value="<?= htmlspecialchars($a['id']) ?>"><?= htmlspecialchars(mb_substr($a['title']['el'] ?? '', 0, 80)) ?></option>
      <?php endforeach; ?>
    </select>

    <label for="boardId">Board</label>
    <select name="boardId" id="boardId" required>
      <?php foreach ($boards as $b): ?>
        <option value="<?= htmlspecialchars($b['id']) ?>"><?= htmlspecialchars($b['name']) ?></option>
      <?php endforeach; ?>
    </select>

    <button type="submit">Δημιουργία Pin μέσω API</button>
  </form>

  <?php if ($action): ?>
    <div class="card">
      <strong>3. Αποτέλεσμα API</strong>
      <p style="font-size:14px;margin:10px 0;">
        <code><?= htmlspecialchars($action['endpoint']) ?></code> →
        <?php if ($action['status'] >= 200 && $action['status'] < 300): ?>
          <span class="ok">HTTP <?= (int)$action['status'] ?> — Pin ID <?= htmlspecialchars($action['pinId']) ?></span>
        <?php else: ?>
          <span class="bad">HTTP <?= (int)$action['status'] ?></span>
        <?php endif; ?>
      </p>
      <div class="row">
        <div style="flex:1;min-width:320px;">
          <label>Request</label>
          <pre><?= htmlspecialchars($action['request']) ?></pre>
          <label>Response</label>
          <pre><?= htmlspecialchars($action['response']) ?></pre>
        </div>
        <div>
          <label>Εικόνα Pin</label>
          <img class="preview" src="/pinterest-pin-image.php?articleId=<?= htmlspecialchars($action['articleId']) ?>" alt="pin">
        </div>
      </div>
    </div>
  <?php endif; ?>
</div>
</body>
</html>
