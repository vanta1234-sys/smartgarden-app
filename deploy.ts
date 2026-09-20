import { Client } from "basic-ftp";
import path from "path";
import fs from "fs";

/**
 * Files the LIVE SERVER writes and owns: articles the cron publishes, the sitemap
 * and feed it regenerates from them, publish logs, OAuth tokens, rate-limit counters,
 * and reader-submitted questions. The local copies of these are snapshots that go
 * stale the moment the cron next runs, so uploading them silently destroys whatever
 * the server has written since.
 *
 * This is not hypothetical: on 2026-09-14 a series of ordinary deploys reverted
 * latest_articles.json to a Sept-9 snapshot, wiping five days of cron-published
 * articles (and the sitemap/rss entries pointing at them) — nobody noticed until a
 * routine article count came back lower than it had been half an hour earlier.
 *
 * To pull the live versions down into the repo instead, fetch them over HTTP
 * (curl https://smartgarden.gr/<file> -o public/<file>) — never let deploy push them up.
 */
const SERVER_OWNED_FILES = new Set([
  "latest_articles.json",
  "sitemap.xml",
  "rss.xml",
  "tiktok_posts.json",
  "qa_questions.json",
  "tiktok_tokens.json",
  "tiktok_tokens_sandbox.json",
  "youtube_tokens.json",
  "facebook_tokens.json",
  "pinterest_tokens.json",
  "pinterest_boards.json",
  "plant_diagnosis_usage.json",
  "newsletter_signup_usage.json",
  "qa_usage.json",
  // Written by the live cron every time it publishes; a local copy would erase history.
  "gemini_usage.json",
  // Rebuilt on the server whenever latest_articles.json changes.
  "articles-index.cache.json",
  // The AdSense slot ids, pasted on the live site via ads-admin.php.
  "ads-slots.json",
  // The Pinterest pin log, appended to by the cron.
  "pinterest_posts.json",
]);

async function deploy() {
  console.log("🚀 Starting SmartGarden deploy to smartgarden.gr...");
  
  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    console.error("❌ 'dist' directory not found! Please run 'npm run build' first.");
    process.exit(1);
  }

  const client = new Client();
  client.ftp.verbose = true;

  // The FTP user and password were string literals here, in a repository that is public
  // on GitHub — the pair that can write to the document root was readable by anyone, from
  // the initial commit onwards. They come from the environment or from .env.deploy
  // (covered by the .env* rule in .gitignore) now, and there is deliberately no fallback:
  // a deploy that cannot find credentials has to stop, not reach for a published pair.
  //
  // Removing them from the file does not make the old pair safe — it stays in every clone
  // and in the commit history. It has to be changed at the host.
  const dotEnvDeploy = (): Record<string, string> => {
    const out: Record<string, string> = {};
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), ".env.deploy"), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      // No file is fine; the environment may carry them instead.
    }
    return out;
  };
  const deployEnv = dotEnvDeploy();

  const FTP_HOST = process.env.FTP_HOST || deployEnv.FTP_HOST || "smartgarden.gr";
  const FTP_USER = process.env.FTP_USER || deployEnv.FTP_USER || "";
  const FTP_PASSWORD = process.env.FTP_PASSWORD || deployEnv.FTP_PASSWORD || "";
  const FTP_REMOTE_DIR = process.env.FTP_REMOTE_DIR || deployEnv.FTP_REMOTE_DIR || "/httpdocs";

  if (!FTP_USER || !FTP_PASSWORD) {
    console.error("❌ FTP_USER and FTP_PASSWORD are not set.");
    console.error("   Put them in .env.deploy in the project root (it is git-ignored):");
    console.error("     FTP_USER=...");
    console.error("     FTP_PASSWORD=...");
    console.error("   or export them in the environment before running the deploy.");
    process.exit(1);
  }

  const hosts = [FTP_HOST, "185.29.24.7", "ftp.smartgarden.gr"];
  let connected = false;

  // Transient FTP outages (network blips, host briefly unreachable) are common —
  // retry the whole host list a few times with backoff before giving up, instead
  // of failing on the first pass and forcing a manual re-run.
  const MAX_PASSES = 4;
  for (let pass = 1; pass <= MAX_PASSES && !connected; pass++) {
    if (pass > 1) {
      const waitMs = 10000 * (pass - 1);
      console.log(`⏳ Retry pass ${pass}/${MAX_PASSES} — waiting ${waitMs / 1000}s before trying again...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
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
  }

  if (!connected) {
    console.error("❌ Failed to connect to any FTP host after retries. Check your network or credentials.");
    process.exit(1);
  }

  try {
    // 1. Upload public/ (skipping anything the live server owns — see SERVER_OWNED_FILES)
    const publicDir = path.join(process.cwd(), "public");
    if (fs.existsSync(publicDir)) {
      const publicFiles = fs.readdirSync(publicDir);
      for (const file of publicFiles) {
        const filePath = path.join(publicDir, file);
        if (!fs.statSync(filePath).isFile()) continue;
        if (SERVER_OWNED_FILES.has(file)) {
          console.log(`⏭️  Skipping public/${file} (server-owned — deploying it would overwrite live data)`);
          continue;
        }
        console.log(`📤 Uploading public/${file} to ${FTP_REMOTE_DIR}/${file}...`);
        await client.uploadFrom(filePath, `${FTP_REMOTE_DIR}/${file}`);
      }
    }

    // 2. Upload dist folder. `vite build` copies everything in public/ into dist/,
    // so the server-owned files have to be removed from the build output too —
    // otherwise this second pass re-uploads the very files pass 1 just skipped.
    for (const file of SERVER_OWNED_FILES) {
      const staleCopy = path.join(distDir, file);
      if (fs.existsSync(staleCopy)) {
        fs.unlinkSync(staleCopy);
        console.log(`⏭️  Removed ${file} from build output (server-owned)`);
      }
    }
    console.log(`📤 Uploading build assets (${distDir}) to ${FTP_REMOTE_DIR}...`);
    await client.ensureDir(FTP_REMOTE_DIR);
    await client.uploadFromDir(distDir, FTP_REMOTE_DIR);

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
