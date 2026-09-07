import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/indexing"];

function getCredentials() {
  const possiblePaths = [
    path.resolve(process.cwd(), "service-account.json"),
    path.resolve(process.cwd(), "..", "service-account.json"),
    path.resolve(__dirname, "service-account.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch (e) {}
    }
  }
  return null;
}

export async function requestGoogleIndex(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error("service-account.json not found. Please provide Google Cloud service account credentials.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  const response = await client.request({
    url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
    method: "POST",
    data: {
      url,
      type,
    },
  });

  return response.data;
}

export async function indexAllSiteUrls(urls: string[]) {
  const results: Array<{ url: string; success: boolean; data?: any; error?: string }> = [];

  for (const url of urls) {
    try {
      const data = await requestGoogleIndex(url, "URL_UPDATED");
      results.push({ url, success: true, data });
      // Minor throttle 100ms
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      results.push({
        url,
        success: false,
        error: err.response?.data?.error?.message || err.message,
      });
    }
  }

  return results;
}
