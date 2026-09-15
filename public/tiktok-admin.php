<?php
/**
 * SmartGarden.gr - TikTok admin tool.
 *
 * Two jobs, same as pinterest-admin.php:
 *  1. A real manual control: pick a rendered video, send it to the TikTok inbox.
 *  2. It makes the API usage *visible* — the endpoint, the request body, the HTTP status
 *     and the raw response are all printed on screen, which is what an app review wants a
 *     demo to show. The Pinterest submission was rejected twice for demonstrating UI
 *     instead of API calls; this is what eventually passed.
 *
 * URL: /tiktok-admin.php?key=<cron key>[&sandbox=1]
 */

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
$key = isset($_GET['key']) ? $_GET['key'] : '';
if (!in_array($key, $VALID_KEYS)) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Unauthorized';
    exit;
}

@set_time_limit(300);

$isSandbox = isset($_GET['sandbox']) && $_GET['sandbox'] === '1';
$tokensPath = __DIR__ . '/' . ($isSandbox ? 'tiktok_tokens_sandbox.json' : 'tiktok_tokens.json');
$tokens = file_exists($tokensPath) ? json_decode(file_get_contents($tokensPath), true) : array();
$accessToken = isset($tokens['access_token']) ? $tokens['access_token'] : '';
$envLabel = $isSandbox ? 'Sandbox' : 'Production';

function ttCall($method, $url, $token, $body = null) {
    $ch = curl_init($url);
    $opts = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token, 'Content-Type: application/json; charset=UTF-8'),
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

function prettyJson($raw) {
    $decoded = json_decode($raw, true);
    return $decoded === null
        ? (string) $raw
        : json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Proves the user.info.basic scope works, and shows which creator is connected.
//
// A stored token is not the same as a live one: when the creator revokes this app from
// their TikTok settings the file stays on disk but every call 401s. Treat that as simply
// disconnected and offer the OAuth link again, rather than reporting a half-state nobody
// can act on.
$creator = null;
if ($accessToken) {
    $info = ttCall('GET', 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', $accessToken);
    $decoded = json_decode($info['body'], true);
    if (isset($decoded['data']['user'])) {
        $creator = $decoded['data']['user'];
    } else {
        $accessToken = '';
    }
}

// Rendered videos waiting on disk, newest first — these come out of video-render.php.
$jobsRoot = is_dir(dirname(__DIR__) . '/video-jobs') ? dirname(__DIR__) . '/video-jobs' : __DIR__ . '/video-jobs';
$jobs = array();
foreach ((array) glob($jobsRoot . '/*', GLOB_ONLYDIR) as $dir) {
    $video = $dir . '/video.mp4';
    if (!is_file($video)) continue;
    $meta = json_decode((string) @file_get_contents($dir . '/job.json'), true);
    $jobs[] = array(
        'id' => basename($dir),
        'title' => isset($meta['script']['cleanTitle']) ? $meta['script']['cleanTitle'] : basename($dir),
        'caption' => isset($meta['script']['tiktokCaption']) ? $meta['script']['tiktokCaption'] : '',
        'bytes' => filesize($video),
        'mtime' => filemtime($video),
    );
}
usort($jobs, function ($a, $b) { return $b['mtime'] - $a['mtime']; });

$action = null;

// ---- Upload a rendered video to the creator's TikTok inbox -------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['job']) && $accessToken) {
    $jobId = basename($_POST['job']);
    $videoPath = $jobsRoot . '/' . $jobId . '/video.mp4';

    if (is_file($videoPath)) {
        $size = filesize($videoPath);
        $initPayload = array(
            'source_info' => array(
                'source' => 'FILE_UPLOAD',
                'video_size' => $size,
                'chunk_size' => $size,
                'total_chunk_count' => 1,
            ),
        );
        $init = ttCall('POST', 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', $accessToken, $initPayload);
        $initDecoded = json_decode($init['body'], true);
        $uploadUrl = isset($initDecoded['data']['upload_url']) ? $initDecoded['data']['upload_url'] : null;
        $publishId = isset($initDecoded['data']['publish_id']) ? $initDecoded['data']['publish_id'] : null;

        $putStatus = null;
        if ($uploadUrl) {
            // TikTok hands back a signed URL; the bytes go there as a single chunk.
            $ch = curl_init($uploadUrl);
            curl_setopt_array($ch, array(
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => 'PUT',
                CURLOPT_TIMEOUT => 240,
                CURLOPT_POSTFIELDS => file_get_contents($videoPath),
                CURLOPT_HTTPHEADER => array(
                    'Content-Type: video/mp4',
                    'Content-Length: ' . $size,
                    'Content-Range: bytes 0-' . ($size - 1) . '/' . $size,
                ),
            ));
            curl_exec($ch);
            $putStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
        }

        $statusResp = null;
        if ($publishId) {
            sleep(3);
            $statusResp = ttCall('POST', 'https://open.tiktokapis.com/v2/post/publish/status/fetch/', $accessToken, array('publish_id' => $publishId));
        }

        $action = array(
            'jobId' => $jobId,
            'bytes' => $size,
            'initEndpoint' => 'POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
            'initRequest' => json_encode($initPayload, JSON_PRETTY_PRINT),
            'initStatus' => $init['status'],
            'initResponse' => prettyJson($init['body']),
            'putStatus' => $putStatus,
            'publishId' => $publishId,
            'statusResponse' => $statusResp ? prettyJson($statusResp['body']) : null,
        );
    }
}
?>
<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartGarden.gr — TikTok Content Posting API</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #FBF6EC; color: #14301C; }
  .wrap { max-width: 1000px; margin: 0 auto; padding: 28px 20px 60px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .sub { color: #5b6b5f; margin-bottom: 22px; font-size: 14px; }
  .card { background: #fff; border: 1px solid #e2ddd0; border-radius: 14px; padding: 20px; margin-bottom: 18px; }
  label { display: block; font-weight: 700; font-size: 13px; margin: 14px 0 6px; }
  select, button { font: inherit; padding: 10px 12px; border-radius: 9px; border: 1px solid #cfc9bb; width: 100%; background: #fff; }
  button { background: #14301C; color: #fff; border: none; font-weight: 700; cursor: pointer; margin-top: 18px; }
  pre { background: #14301C; color: #d7f0dc; padding: 14px; border-radius: 10px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
  .ok { color: #2E6B3A; font-weight: 700; }
  .bad { color: #b3261e; font-weight: 700; }
  .env { display: inline-block; background: #eef3ec; border: 1px solid #cfe0d2; padding: 4px 10px; border-radius: 99px; font-size: 12px; }
  .creator { display: flex; align-items: center; gap: 12px; }
  .creator img { width: 48px; height: 48px; border-radius: 50%; }
  .step { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #5b6b5f; margin-top: 18px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>SmartGarden.gr — TikTok Content Posting API</h1>
  <div class="sub">
    Αποστολή δημοσιευμένου βίντεο στο TikTok inbox του δημιουργού.
    <span class="env"><?= htmlspecialchars($envLabel) ?> · open.tiktokapis.com</span>
  </div>

  <div class="card">
    <strong>1. Σύνδεση (scope: user.info.basic)</strong>
    <p style="margin:10px 0 0;font-size:14px;">
      <?php if ($creator): ?>
        <span class="creator">
          <?php if (!empty($creator['avatar_url'])): ?><img src="<?= htmlspecialchars($creator['avatar_url']) ?>" alt=""><?php endif; ?>
          <span>
            <span class="ok">✓ Συνδεδεμένο</span><br>
            <?= htmlspecialchars(isset($creator['display_name']) ? $creator['display_name'] : '') ?>
          </span>
        </span>
      <?php else: ?>
        <span class="bad">✗ Μη συνδεδεμένο</span> —
        <a href="/tiktok-auth-login.php<?= $isSandbox ? '?sandbox=1' : '' ?>">σύνδεση μέσω OAuth</a>
      <?php endif; ?>
    </p>
  </div>

  <form method="post" class="card">
    <strong>2. Αποστολή βίντεο (scope: video.upload)</strong>
    <label for="job">Βίντεο από δημοσιευμένο άρθρο</label>
    <select name="job" id="job" required>
      <?php foreach (array_slice($jobs, 0, 30) as $j): ?>
        <option value="<?= htmlspecialchars($j['id']) ?>">
          <?= htmlspecialchars(mb_substr($j['title'], 0, 70)) ?> — <?= round($j['bytes'] / 1048576, 1) ?> MB
        </option>
      <?php endforeach; ?>
    </select>
    <?php if (!count($jobs)): ?>
      <p style="font-size:13px;color:#b3261e;margin-top:10px;">
        Δεν υπάρχει κανένα rendered βίντεο. Τρέξε πρώτα <code>/video-render.php?action=start&amp;key=…</code>
      </p>
    <?php endif; ?>
    <button type="submit" <?= $accessToken && count($jobs) ? '' : 'disabled' ?>>Αποστολή στο TikTok μέσω API</button>
  </form>

  <?php if ($action): ?>
    <div class="card">
      <strong>3. Αποτέλεσμα API</strong>

      <div class="step">Βήμα 1 — Αρχικοποίηση</div>
      <p style="font-size:14px;margin:6px 0;">
        <code><?= htmlspecialchars($action['initEndpoint']) ?></code> →
        <?php if ($action['initStatus'] >= 200 && $action['initStatus'] < 300): ?>
          <span class="ok">HTTP <?= (int) $action['initStatus'] ?></span>
        <?php else: ?>
          <span class="bad">HTTP <?= (int) $action['initStatus'] ?></span>
        <?php endif; ?>
      </p>
      <label>Request</label>
      <pre><?= htmlspecialchars($action['initRequest']) ?></pre>
      <label>Response</label>
      <pre><?= htmlspecialchars($action['initResponse']) ?></pre>

      <div class="step">Βήμα 2 — Μεταφόρτωση αρχείου</div>
      <p style="font-size:14px;margin:6px 0;">
        <code>PUT &lt;signed upload_url&gt;</code> · <?= number_format($action['bytes']) ?> bytes →
        <?php if ($action['putStatus'] && $action['putStatus'] < 300): ?>
          <span class="ok">HTTP <?= (int) $action['putStatus'] ?></span>
        <?php else: ?>
          <span class="bad">HTTP <?= (int) $action['putStatus'] ?></span>
        <?php endif; ?>
      </p>

      <?php if ($action['statusResponse']): ?>
        <div class="step">Βήμα 3 — Κατάσταση επεξεργασίας</div>
        <p style="font-size:14px;margin:6px 0;">
          <code>POST https://open.tiktokapis.com/v2/post/publish/status/fetch/</code>
        </p>
        <label>Response</label>
        <pre><?= htmlspecialchars($action['statusResponse']) ?></pre>
      <?php endif; ?>

      <p style="font-size:13px;color:#5b6b5f;margin-top:14px;">
        Το βίντεο φτάνει ως πρόχειρο στο inbox του δημιουργού. Η τελική δημοσίευση γίνεται
        πάντα χειροκίνητα μέσα από την εφαρμογή TikTok — αυτό είναι το scope
        <code>video.upload</code>, όχι το <code>video.publish</code>.
      </p>
    </div>
  <?php endif; ?>
</div>
</body>
</html>
