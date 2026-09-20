<?php
/**
 * Run `php -l` against a file in public/, on the server.
 *
 * A PHP fatal here is swallowed by Cloudflare and comes back as a bare 503 with no body,
 * and this host is FTP-only with no log access — so without this, a syntax error is found
 * by bisecting a deploy at a time.
 *
 * /_lint.php?key=<cron key>&file=cron-publish.php
 */
header('Content-Type: application/json; charset=utf-8');

$VALID_KEYS = array('smartgarden_cron_x7K9pQ2026', 'smartgarden_cron_secret_2026');
if (!in_array(isset($_GET['key']) ? $_GET['key'] : '', $VALID_KEYS, true)) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$file = isset($_GET['file']) ? basename($_GET['file']) : '';
$path = __DIR__ . '/' . $file;
if ($file === '' || substr($file, -4) !== '.php' || !is_file($path)) {
    echo json_encode(array('success' => false, 'error' => 'Give &file=<something>.php in public/'));
    exit;
}

$cli = null;
foreach (array('/opt/plesk/php/8.3/bin/php', '/opt/plesk/php/8.2/bin/php', '/usr/local/bin/php', '/usr/bin/php', 'php') as $c) {
    $probe = @shell_exec(escapeshellarg($c) . ' -v 2>&1');
    if (is_string($probe) && stripos($probe, 'PHP ') === 0) { $cli = $c; break; }
}
if (!$cli) {
    echo json_encode(array('success' => false, 'error' => 'No PHP CLI found'));
    exit;
}

$version = trim((string) @shell_exec(escapeshellarg($cli) . ' -r "echo PHP_VERSION;" 2>&1'));
$out = (string) @shell_exec(escapeshellarg($cli) . ' -l ' . escapeshellarg($path) . ' 2>&1');

echo json_encode(array(
    'success' => stripos($out, 'No syntax errors') !== false,
    'file' => $file,
    'cliVersion' => $version,
    'output' => trim($out),
), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
