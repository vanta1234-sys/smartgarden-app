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
          'https://facebook.com/smartgarden.gr',
          'https://instagram.com/smartgarden.gr',
          'https://tiktok.com/@smartgarden.gr',
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
        'author': {
          '@type': 'Organization',
          'name': 'SmartGarden.gr Agronomy Team',
          'url': 'https://smartgarden.gr',
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
            'item': `https://smartgarden.gr/category/${article.category}`,
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
        'mainEntity': [
          {
            '@type': 'Question',
            'name': `Ποια είναι η βέλτιστη μέθοδος εφαρμογής για «${title.slice(0, 60)}...»;`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': summary || 'Ακολουθήστε τις οδηγίες δοσολογίας, την κατάλληλη ώρα εφαρμογής (πρωί ή σούρουπο) και τον έλεγχο pH/αποστράγγισης.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Ποια είναι τα συχνότερα λάθη που πρέπει να αποφευχθούν;',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Αποφύγετε υπερβολικές δοσολογίες, εφαρμογή υπό άμεσο μεσημεριανό ήλιο και ανάμειξη ασύμβατων σκευασμάτων χωρίς διαβρέκτη.',
            },
          },
        ],
      },
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
