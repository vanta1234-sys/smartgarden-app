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

export const AD_SLOTS = {
  /** Between the article's key points and the body — seen by everyone who opens it. */
  articleTop: '',
  /** After the body, before the FAQ — seen by readers who finished, so worth the most. */
  articleEnd: '',
};
