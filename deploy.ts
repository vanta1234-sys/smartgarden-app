import { Client } from "basic-ftp";
import path from "path";
import fs from "fs";

async function deploy() {
  console.log("🚀 Starting SmartGarden deploy to smartgarden.gr...");
  
  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    console.error("❌ 'dist' directory not found! Please run 'npm run build' first.");
    process.exit(1);
  }

  const client = new Client();
  client.ftp.verbose = true;

  const FTP_HOST = process.env.FTP_HOST || "smartgarden.gr";
  const FTP_USER = process.env.FTP_USER || "smartgarden.gr_8p3lo1vph0t";
  const FTP_PASSWORD = process.env.FTP_PASSWORD || "Uc0Lptjan_j47Eg~";
  const FTP_REMOTE_DIR = process.env.FTP_REMOTE_DIR || "./";

  const hosts = [FTP_HOST, "185.29.24.7", "ftp.smartgarden.gr"];
  let connected = false;

  for (const host of hosts) {
    try {
      console.log(`📡 Connecting to FTP (${host})...`);
      await client.access({
        host,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: false,
        port: 21,
      });
      connected = true;
      console.log(`✅ Connected successfully to ${host}!`);
      break;
    } catch (err: any) {
      console.warn(`⚠️ Connection to ${host} failed:`, err.message);
    }
  }

  if (!connected) {
    console.error("❌ Failed to connect to any FTP host. Check your network or credentials.");
    process.exit(1);
  }

  try {
    // 1. Upload latest_articles.json & cron.php directly if available in public
    const publicDir = path.join(process.cwd(), "public");
    if (fs.existsSync(publicDir)) {
      const publicFiles = fs.readdirSync(publicDir);
      for (const file of publicFiles) {
        const filePath = path.join(publicDir, file);
        if (fs.statSync(filePath).isFile()) {
          console.log(`📤 Uploading public/${file} to ${file}...`);
          await client.uploadFrom(filePath, file);
        }
      }
    }

    // 2. Upload dist folder
    console.log(`📤 Uploading build assets (${distDir}) to root...`);
    await client.uploadFromDir(distDir, "");

    console.log("\n🎉 ========================================================");
    console.log("🌟 DEPLOY SUCCESSFUL! Your changes are now LIVE at:");
    console.log("👉 https://smartgarden.gr");
    console.log("========================================================\n");
  } catch (err: any) {
    console.error("❌ Error during file upload:", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
