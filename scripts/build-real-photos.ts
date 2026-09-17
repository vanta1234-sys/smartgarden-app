/**
 * Resize the garden photographs for the web and mirror their list for the PHP side.
 *
 * Reads the originals from the user's phone dump, writes public/photos/*.jpg, and writes
 * public/real-photos.json for article.php. Skips a photo that is already up to date, so a
 * normal build does not re-encode 22 images.
 *
 * sharp drops EXIF unless withMetadata() is called, and that is the point: the originals
 * carry the GPS coordinates of the garden and must not be published.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { REAL_PHOTOS } from '../src/data/realPhotos';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const SRC = 'C:/Users/me/Downloads/real life fotos';
const OUT = path.join(root, 'public', 'photos');

fs.mkdirSync(OUT, { recursive: true });
// `source` is a local filename the served site has no use for.
fs.writeFileSync(
  path.join(root, 'public', 'real-photos.json'),
  JSON.stringify(REAL_PHOTOS.map(({ source, ...rest }) => rest), null, 2),
  'utf8'
);

if (!fs.existsSync(SRC)) {
  // The originals live outside the repo. Once public/photos is populated and committed a
  // build elsewhere does not need them.
  console.log(`real-photos.json written; originals not present at ${SRC}, images left as-is`);
  process.exit(0);
}

let made = 0;
for (const p of REAL_PHOTOS) {
  const dest = path.join(OUT, path.basename(p.file));
  if (fs.existsSync(dest)) continue;
  if (!fs.existsSync(path.join(SRC, p.source))) {
    console.warn(`no original for ${path.basename(p.file)} (${p.source})`);
    continue;
  }
  // Every original is portrait — the phone was held upright — and a 900x1200 photo at the
  // full width of an article column is a 900px-tall wall in the middle of the text. Cropped
  // to 3:2 with sharp's attention strategy, which keeps the region with the most detail,
  // so the fruit survives the crop rather than the sky.
  await sharp(path.join(SRC, p.source)).rotate()
    .resize({ width: 900, height: 675, fit: 'cover', position: p.crop || 'centre' })
    .jpeg({ quality: 76, mozjpeg: true, progressive: true })
    .toFile(dest);
  made++;
}
console.log(`real-photos.json: ${REAL_PHOTOS.length} photos, ${made} re-encoded`);
