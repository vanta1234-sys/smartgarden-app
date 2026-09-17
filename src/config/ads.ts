/**
 * AdSense ad unit IDs.
 *
 * The site carries only the Auto Ads tag, and Auto Ads places into normal document flow —
 * but the article a reader actually spends twelve minutes with is rendered inside a
 * fixed-position overlay with its own scroll container, which is close to the worst case
 * for automatic placement. That is why the page loads the AdSense script, is listed in
 * ads.txt, and still shows no ad.
 *
 * Placed units do not have that problem. Each needs an ID from the AdSense dashboard:
 *
 *   Ads -> By ad unit -> Display ads -> Responsive -> Create
 *
 * Paste the number from the generated snippet's `data-ad-slot` below. An empty string
 * renders nothing at all, so leaving one blank is safe.
 */
export const AD_CLIENT = 'ca-pub-6346961910073260';

/**
 * The ids themselves live on the server, in ads-slots.json, and travel with the page as
 * window.__SG_ADS__. Compiling them into the bundle meant the site could not start earning
 * until someone was at a machine with the repo and ran a deploy; now pasting them on
 * /ads-admin.php is enough.
 */
type Slots = { articleTop: string; articleEnd: string };

const COMPILED: Slots = {
  /** Between the article's key points and the body — seen by everyone who opens it. */
  articleTop: '',
  /** After the body, before the FAQ — seen by readers who finished, so worth the most. */
  articleEnd: '',
};

function fromPage(): Partial<Slots> {
  try {
    const s = (window as any).__SG_ADS__;
    return s && typeof s === 'object' ? s : {};
  } catch {
    return {};
  }
}

export const AD_SLOTS: Slots = { ...COMPILED, ...fromPage() };
