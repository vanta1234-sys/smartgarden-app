/**
 * Ask the image CDN for the size the element will actually display.
 *
 * Article photos are stored at w=1200. A related-article card renders one into a 291x80
 * box — a 175KB download, 1200x1600 of pixels, for a thumbnail. Unsplash resizes from the
 * URL, so the fix is to ask for the right size rather than to scale a large one down in
 * the browser.
 *
 * Widths are doubled for retina. Anything that is not an Unsplash URL is returned
 * unchanged, including our own /photos files, which are already the size they render at.
 */
export function sizedImage(src: string | undefined | null, width: number, height?: number): string {
  const s = (src || '').trim();
  if (!s || !/images\.unsplash\.com/.test(s)) return s;

  const w = Math.round(width * 2);
  const h = height ? Math.round(height * 2) : null;

  let out = /[?&]w=\d+/.test(s) ? s.replace(/([?&])w=\d+/, `$1w=${w}`) : s + (s.includes('?') ? '&' : '?') + `w=${w}`;
  if (h) {
    out = /[?&]h=\d+/.test(out) ? out.replace(/([?&])h=\d+/, `$1h=${h}`) : out.replace(/([?&])w=\d+/, `$1w=${w}&h=${h}`);
  }
  return out;
}
