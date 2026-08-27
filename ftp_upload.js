import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FTP_HOST = 'smartgarden.gr';
const FTP_USER = 'smartgarden.gr_8p3lo1vph0t';
const FTP_PASSWORD = 'Uc0Lptjan_j47Eg~';
const FTP_REMOTE_DIR = '/httpdocs';

const logFile = path.join(__dirname, 'deploy_log.txt');
function log(msg) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n', 'utf8');
}

async function getFtpClient() {
  try {
    const ftp = await import('basic-ftp');
    return ftp;
  } catch (e) {
    log('📦 Package basic-ftp not found locally. Auto-installing in 3 seconds...');
    try {
      execSync('npm install basic-ftp --no-audit --no-fund', { cwd: __dirname, stdio: 'inherit' });
      const ftp = await import('basic-ftp');
      return ftp;
    } catch (installErr) {
      log('⚠️ Could not install basic-ftp via npm. Running PowerShell fallback uploader...');
      return null;
    }
  }
}

async function deployWithPowerShellFallback() {
  log('🚀 Executing PowerShell automated FTP upload...');
  const psScript = path.join(__dirname, 'deploy.ps1');
  if (fs.existsSync(psScript)) {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScript}"`, { cwd: __dirname, stdio: 'inherit' });
  } else {
    log('❌ deploy.ps1 not found.');
  }
}

async function deploy() {
  fs.writeFileSync(logFile, `=== SMARTGARDEN DEPLOY LOG: ${new Date().toISOString()} ===\n`, 'utf8');

  console.log('\n======================================================');
  console.log('  🌱 SMARTGARDEN FTP DEPLOYMENT & LIVE DIAGNOSTICS');
  console.log('======================================================\n');
  log(`Target Host: ${FTP_HOST}`);
  log(`Target User: ${FTP_USER}`);
  log(`Remote Directory: ${FTP_REMOTE_DIR}`);

  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    log('❌ ERROR: dist folder not found! Please run "npm run build" first.');
    process.exit(1);
  }

  const ftpModule = await getFtpClient();
  if (!ftpModule) {
    await deployWithPowerShellFallback();
    return;
  }

  const client = new ftpModule.Client();
  client.ftp.verbose = false;

  const candidateHosts = [FTP_HOST, 'ftp.smartgarden.gr', 'admin.mynewserver.com'];
  let connected = false;

  for (const host of candidateHosts) {
    try {
      log(`Connecting to ${host}...`);
      await client.access({
        host: host,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: false,
        port: 21,
      });
      log(`✅ Successfully connected and authenticated to ${host}!`);
      connected = true;
      break;
    } catch (err) {
      log(`⚠️ Connection to ${host} failed: ${err.message}`);
    }
  }

  if (!connected) {
    log('❌ Could not connect via Node basic-ftp. Trying PowerShell fallback...');
    client.close();
    await deployWithPowerShellFallback();
    return;
  }

  try {
    log(`Switching to remote directory: ${FTP_REMOTE_DIR}`);
    await client.ensureDir(FTP_REMOTE_DIR);

    log(`🚀 Uploading contents of ${distDir} to ${FTP_REMOTE_DIR}...`);
    client.trackProgress(info => {
      console.log(` -> [${info.name}] ${info.bytesOverall} bytes uploaded`);
    });

    await client.uploadFromDir(distDir, FTP_REMOTE_DIR);

    log('✅ All files uploaded successfully to smartgarden.gr!');
    console.log('\n======================================================');
    console.log('  🎉 DEPLOYMENT COMPLETE! Site updated at: https://smartgarden.gr');
    console.log('======================================================\n');
  } catch (err) {
    log(`❌ Error during file upload: ${err.message}`);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
