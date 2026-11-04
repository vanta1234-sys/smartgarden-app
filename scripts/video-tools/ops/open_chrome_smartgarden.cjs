// Opens Chrome straight in the owner's "smartgarden" profile (the one logged in to TikTok @smartgarden68 and carrying the Claude extension), so the profile
// picker never appears and nobody has to click an account. Used by the 10:00 task before the TikTok step when no browser is connected (owner's idea 2026-11-04).
// The profile FOLDER is looked up by its name in Chrome's Local State (it is "Profile 2" today) so a renumbering does not send it to another account.
// usage:  node scripts/video-tools/ops/open_chrome_smartgarden.cjs
// If Chrome is already running this just opens one more window of that profile. It only starts Chrome: no URL, no login, no clicks.
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
if (!exe) { console.log('chrome.exe not found'); process.exit(1); }
let dir = '';
try {
  const state = JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Local State'), 'utf8'));
  const cache = (state.profile && state.profile.info_cache) || {};
  dir = Object.keys(cache).find((k) => String(cache[k].name || '').toLowerCase() === 'smartgarden') || '';
} catch (e) { /* handled below */ }
if (!dir) { console.log('no Chrome profile named "smartgarden" found: not opening anything'); process.exit(1); }
spawn(exe, ['--profile-directory=' + dir], { detached: true, stdio: 'ignore' }).unref();
console.log('started Chrome in the "smartgarden" profile (' + dir + ')');
