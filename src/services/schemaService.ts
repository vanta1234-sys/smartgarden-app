import { CATEGORY_FAQS, DEFAULT_FAQS, FaqItem } from '../data/categoryFaqs';

export interface ArticleItem {
  id: string;
  slug: string;
  title: {
    el: string;
    en?: string;
  };
  summary: {
    el: string;
    en?: string;
  };
  content: {
    el: string;
    en?: string;
  };
  category: string;
  categoryLabel?: {
    el: string;
    en?: string;
  };
  imageUrl?: string;
  image?: string;
  date?: string;
  author?: {
    name: string;
    role?: {
      el: string;
    };
    avatar?: string;
  };
}

export function injectGlobalSiteSchema() {
  if (typeof document === 'undefined') return;

  const scriptId = 'smartgarden-global-schema';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const globalSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://smartgarden.gr/#organization',
        'name': 'SmartGarden.gr',
        'url': 'https://smartgarden.gr',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://smartgarden.gr/logo-schema.png',
        },
        'description': 'Επιστημονική Γεωπονία, Αστική Κηπουρική, Τηλεμετρία & Αυτοματισμοί Άρδευσης.',
        'sameAs': [
          // Real Page ID (2026-09-08) — the site never claimed the "smartgarden.gr"
          // vanity username, so that placeholder URL didn't point at the real Page.
          'https://www.facebook.com/profile.php?id=1340919395764582',
          'https://tiktok.com/@smartgarden.gr',
          // Real, publicly live channel with real uploaded content (2026-09-08).
          'https://www.youtube.com/@Smartgarden-h4f',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://smartgarden.gr/#website',
        'url': 'https://smartgarden.gr',
        'name': 'SmartGarden.gr',
        'publisher': { '@id': 'https://smartgarden.gr/#organization' },
        'inLanguage': 'el-GR',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://smartgarden.gr/?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  script.textContent = JSON.stringify(globalSchema);
}

export function getFaqsForArticle(article: ArticleItem): FaqItem[] {
  return CATEGORY_FAQS[article.category] || DEFAULT_FAQS;
}

interface HowToStepData {
  name: string;
  text: string;
}

// Every generated article's "Βήμα-προς-Βήμα" section already follows a consistent
// "**Βήμα N: <title>**\n<description>" markdown pattern (see cron-publish.php's
// prompt) — parse it directly instead of hand-authoring separate HowTo content,
// so the schema always matches what the reader actually sees in the article body.
export function getHowToStepsForArticle(article: ArticleItem): HowToStepData[] {
  const content = article.content?.el || '';
  const steps: HowToStepData[] = [];
  const regex = /\*\*Βήμα\s*\d+[:.]?\s*([^*\n]+)\*\*\s*\n+([\s\S]*?)(?=\n\*\*Βήμα\s*\d+|\n##|\n\*\*Εργαλεία|$)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    const text = match[2]
      .replace(/[*_#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (name && text) {
      steps.push({ name, text });
    }
  }
  return steps.slice(0, 12);
}

export function injectArticleSchema(article: ArticleItem) {
  if (typeof document === 'undefined' || !article) return;

  const scriptId = 'smartgarden-article-schema';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const title = article.title?.el || (typeof article.title === 'string' ? article.title : 'Οδηγός SmartGarden');
  const summary = article.summary?.el || (typeof article.summary === 'string' ? article.summary : '');
  const url = `https://smartgarden.gr/article/${article.slug}`;
  const imgUrl = article.imageUrl || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200';
  const pubDate = article.date || '2026-08-25';
  const howToSteps = getHowToStepsForArticle(article);

  // Dynamic FAQ questions extracted or tailored to the article
  const articleSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        'isPartOf': { '@id': 'https://smartgarden.gr/#website' },
        'headline': title,
        'description': summary,
        'url': url,
        'image': [imgUrl],
        'datePublished': pubDate,
        'dateModified': pubDate,
        'inLanguage': 'el-GR',
        // A real Person (with a bio page) is a much stronger E-E-A-T/Discover
        // signal than a generic Organization byline — see /syntaktis (added
        // 2026-09-07) for the actual bio content this links to.
        'author': {
          '@type': 'Person',
          'name': article.author?.name || 'Κώστας Αναστασιάδης',
          'url': 'https://smartgarden.gr/syntaktis',
          'jobTitle': article.author?.role?.el || 'Γεωπόνος M.Sc. & Smart Farming Specialist',
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'SmartGarden.gr',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://smartgarden.gr/logo-schema.png',
          },
        },
        'mainEntityOfPage': url,
        'keywords': `${article.categoryLabel?.el || article.category}, κηπουρική, μπαλκόνι, φυτοπροστασία, λίπασμα`,
        'wordCount': (article.content?.el || '').trim().split(/\s+/).filter(Boolean).length,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Αρχική',
            'item': 'https://smartgarden.gr',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': article.categoryLabel?.el || 'Άρθρα',
            'item': `https://smartgarden.gr/kategoria/${article.category}`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': title,
            'item': url,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        // Matches the visible FAQ accordion rendered under the article (FaqAccordion.tsx) —
        // per Google's structured-data guidelines, FAQPage markup must reflect on-page content.
        'mainEntity': getFaqsForArticle(article).map((faq) => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer,
          },
        })),
      },
      // Only emitted when the article body actually has a parsed "Βήμα N" sequence —
      // an empty/fake HowTo would violate Google's "must match visible content" rule.
      ...(howToSteps.length >= 2 ? [{
        '@type': 'HowTo',
        '@id': `${url}#howto`,
        'name': title,
        'step': howToSteps.map((s) => ({
          '@type': 'HowToStep',
          'name': s.name,
          'text': s.text,
        })),
      }] : []),
    ],
  };

  script.textContent = JSON.stringify(articleSchema);

  // Also update standard document title and meta tags dynamically for client-side preview
  if (typeof document !== 'undefined') {
    document.title = `${title} | SmartGarden.gr`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && summary) {
      metaDesc.setAttribute('content', summary.slice(0, 160));
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && summary) ogDesc.setAttribute('content', summary.slice(0, 200));
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && imgUrl) ogImg.setAttribute('content', imgUrl);
  }
}
