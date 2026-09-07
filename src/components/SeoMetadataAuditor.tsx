import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Check,
  Smartphone,
  Globe,
  Share2,
  Sliders,
  Info,
  Layers,
  Zap,
  Target,
  Copy,
  ExternalLink,
  Laptop,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  Tag,
  Lightbulb,
  ShieldCheck,
  Flame,
  FileCode
} from 'lucide-react';
import { ArticleItem } from '../types';

interface SeoMetadataAuditorProps {
  article: ArticleItem;
  title: string;
  summary: string;
  content: string;
  category: string;
  image: string;
  slug?: string;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateSummary: (newSummary: string) => void;
  onUpdateContent?: (newContent: string) => void;
  onSave?: () => void;
}

interface SeoCheck {
  id: string;
  category: 'title' | 'description' | 'keywords' | 'content' | 'technical';
  label: string;
  status: 'pass' | 'warning' | 'fail';
  scoreImpact: number;
  currentValue: string | number;
  targetValue: string;
  message: string;
  actionSuggestion?: string;
  quickFix?: {
    label: string;
    apply: () => void;
  };
}

export function SeoMetadataAuditor({
  article,
  title,
  summary,
  content,
  category,
  image,
  slug,
  onUpdateTitle,
  onUpdateSummary,
  onUpdateContent,
  onSave
}: SeoMetadataAuditorProps) {
  // Preview mode toggle
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('google_desktop');
  const [previewTab, setPreviewTab] = useState<'serp' | 'social'>('serp');
  const [filterTab, setFilterTab] = useState<'all' | 'issues' | 'passed'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-detect or user-defined target focus keyword
  const [targetKeywordInput, setTargetKeywordInput] = useState<string>('');

  // Extract clean text from markdown content
  const cleanContentText = useMemo(() => {
    return content
      .replace(/#+\s+/g, ' ')
      .replace(/(\*\*|\*|__|_|`|~)/g, ' ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\|/g, ' ')
      .replace(/-{3,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [content]);

  // Extract candidate keywords from title and content
  const extractedKeywords = useMemo(() => {
    const stopWords = new Set([
      'και', 'για', 'με', 'στο', 'στην', 'στον', 'στους', 'στις', 'του', 'της', 'των',
      'από', 'προς', 'είναι', 'πως', 'που', 'ότι', 'σαν', 'μέσα', 'έξω', 'όλα', 'αυτό',
      'αυτή', 'αυτά', 'ένα', 'μία', 'ένας', 'τους', 'μας', 'σας', 'όταν', 'αν', 'όμως',
      'κατά', 'χωρίς', 'όχι', 'ναι', 'όπως', 'μετά', 'πριν', 'πολύ', 'λίγο', 'the', 'and',
      'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an', 'is', 'how', 'guide', 'smart'
    ]);

    const words = (title + ' ' + cleanContentText)
      .toLowerCase()
      .replace(/[^a-z0-9\u0370-\u03ff\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    const freqMap: Record<string, number> = {};
    words.forEach((w) => {
      freqMap[w] = (freqMap[w] || 0) + 1;
    });

    // Also detect 2-word phrases from title
    const titleWords = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0370-\u03ff\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const phraseCandidates: string[] = [];
    for (let i = 0; i < titleWords.length - 1; i++) {
      const phrase = `${titleWords[i]} ${titleWords[i + 1]}`;
      if (!phraseCandidates.includes(phrase)) {
        phraseCandidates.push(phrase);
      }
    }

    const singleTop = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word]) => word);

    return Array.from(new Set([...phraseCandidates.slice(0, 3), ...singleTop]));
  }, [title, cleanContentText]);

  // Active target keyword: user input or top candidate
  const activeKeyword = useMemo(() => {
    if (targetKeywordInput.trim()) return targetKeywordInput.trim();
    if (extractedKeywords.length > 0) return extractedKeywords[0];
    return 'κηπουρική';
  }, [targetKeywordInput, extractedKeywords]);

  // Word count calculations
  const totalWords = useMemo(() => {
    const trimmed = cleanContentText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [cleanContentText]);

  // Keyword occurrences and density
  const keywordStats = useMemo(() => {
    if (!activeKeyword) return { count: 0, density: 0, inTitle: false, inSummary: false, inIntro: false, inHeadings: false };

    const kwRegex = new RegExp(`\\b${activeKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');

    const contentMatches = cleanContentText.match(kwRegex) || [];
    const titleMatches = title.match(kwRegex) || [];
    const summaryMatches = summary.match(kwRegex) || [];

    // First 100 words (intro)
    const first100 = cleanContentText.split(/\s+/).slice(0, 100).join(' ');
    const introMatches = first100.match(kwRegex) || [];

    // Headings (## in markdown)
    const headings = (content.match(/^#{1,4}\s+.+$/gm) || []).join(' ');
    const headingMatches = headings.match(kwRegex) || [];

    const totalCount = contentMatches.length + titleMatches.length;
    const density = totalWords > 0 ? Number(((contentMatches.length / totalWords) * 100).toFixed(2)) : 0;

    return {
      count: totalCount,
      contentCount: contentMatches.length,
      density,
      inTitle: titleMatches.length > 0,
      inSummary: summaryMatches.length > 0,
      inIntro: introMatches.length > 0,
      inHeadings: headingMatches.length > 0
    };
  }, [activeKeyword, title, summary, content, cleanContentText, totalWords]);

  // Secondary semantic keywords detection
  const secondaryKeywordsAnalysis = useMemo(() => {
    return extractedKeywords.slice(0, 6).map((kw) => {
      const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      const matches = cleanContentText.match(kwRegex) || [];
      const density = totalWords > 0 ? Number(((matches.length / totalWords) * 100).toFixed(2)) : 0;
      return {
        keyword: kw,
        count: matches.length,
        density
      };
    });
  }, [extractedKeywords, cleanContentText, totalWords]);

  // Computed Article Slug & URL
  const cleanSlug = useMemo(() => {
    if (slug) return slug;
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u0370-\u03ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [slug, title]);

  const canonicalUrl = `https://smartgarden.gr/article/${cleanSlug}`;

  // Real-time Action Quick Fixes
  const handleOptimizeTitle = () => {
    let newTitle = title.trim();
    if (!newTitle.toLowerCase().includes(activeKeyword.toLowerCase())) {
      newTitle = `${activeKeyword.charAt(0).toUpperCase() + activeKeyword.slice(1)}: ${newTitle}`;
    }
    if (newTitle.length < 50) {
      newTitle = `${newTitle} | Πλήρης Επιστημονικός Οδηγός`;
    } else if (newTitle.length > 65) {
      // trim neatly
      newTitle = newTitle.slice(0, 60).replace(/\s+\S*$/, '') + '...';
    }
    onUpdateTitle(newTitle);
  };

  const handleOptimizeSummary = () => {
    let newSummary = summary.trim();
    if (!newSummary.toLowerCase().includes(activeKeyword.toLowerCase())) {
      newSummary = `Μάθετε τα πάντα για ${activeKeyword}. ${newSummary}`;
    }
    if (!/(οδηγός|μάθετε|δείτε|ανακαλύψτε|συμβουλές|βήμα-βήμα)/i.test(newSummary)) {
      newSummary = `${newSummary} Δείτε αναλυτικές οδηγίες βήμα-βήμα.`;
    }
    if (newSummary.length < 130) {
      newSummary = `${newSummary} Επιστημονικές τεχνικές και πρακτικές συμβουλές από γεωπόνους του SmartGarden.gr.`;
    }
    if (newSummary.length > 158) {
      newSummary = newSummary.slice(0, 155).replace(/\s+\S*$/, '') + '.';
    }
    onUpdateSummary(newSummary);
  };

  const handleInjectKeywordInIntro = () => {
    if (!onUpdateContent) return;
    const injection = `\n\nΣε αυτόν τον αναλυτικό οδηγό εξετάζουμε αναλυτικά όλες τις τεχνικές για **${activeKeyword}**, διασφαλίζοντας μέγιστη αποτελεσματικότητα και υγεία των φυτών.\n\n`;
    onUpdateContent(injection + content);
  };

  // Compile Comprehensive SEO Checklist
  const checks: SeoCheck[] = useMemo(() => {
    const list: SeoCheck[] = [];

    // 1. TITLE LENGTH AUDIT
    const titleLen = title.length;
    if (titleLen >= 50 && titleLen <= 65) {
      list.push({
        id: 'title-length',
        category: 'title',
        label: 'Μήκος Τίτλου (Title Tag)',
        status: 'pass',
        scoreImpact: 15,
        currentValue: `${titleLen} χαρακτήρες`,
        targetValue: '50 - 65 χαρακτήρες',
        message: 'Ιδανικό μήκος! Ο τίτλος προβάλλεται πλήρως στα αποτελέσματα Google χωρίς αποκοπή.'
      });
    } else if (titleLen >= 40 && titleLen < 50) {
      list.push({
        id: 'title-length',
        category: 'title',
        label: 'Μήκος Τίτλου (Title Tag)',
        status: 'warning',
        scoreImpact: 10,
        currentValue: `${titleLen} χαρακτήρες`,
        targetValue: '50 - 65 χαρακτήρες',
        message: 'Ελαφρώς σύντομος τίτλος. Προσθέστε 5-15 χαρακτήρες για υψηλότερο CTR (Click-Through Rate).',
        actionSuggestion: 'Προσθέστε έναν προσδιορισμό (π.χ. "Πλήρης Οδηγός" ή "Βήμα-Βήμα").',
        quickFix: {
          label: '✨ Βελτιστοποίηση Τίτλου',
          apply: handleOptimizeTitle
        }
      });
    } else if (titleLen > 65) {
      list.push({
        id: 'title-length',
        category: 'title',
        label: 'Μήκος Τίτλου (Title Tag)',
        status: 'warning',
        scoreImpact: 8,
        currentValue: `${titleLen} χαρακτήρες`,
        targetValue: '50 - 65 χαρακτήρες',
        message: 'Ο τίτλος υπερβαίνει το όριο των 65 χαρακτήρων και θα αποκοπεί με "..." στη Google.',
        actionSuggestion: 'Συντομεύστε τον τίτλο ώστε να χωράει ολόκληρος στα αποτελέσματα αναζήτησης.',
        quickFix: {
          label: '✂️ Συντόμευση σε <65 chars',
          apply: handleOptimizeTitle
        }
      });
    } else {
      list.push({
        id: 'title-length',
        category: 'title',
        label: 'Μήκος Τίτλου (Title Tag)',
        status: 'fail',
        scoreImpact: 0,
        currentValue: `${titleLen} χαρακτήρες`,
        targetValue: '50 - 65 χαρακτήρες',
        message: 'Πολύ μικρός ή κενός τίτλος. Απαιτούνται τουλάχιστον 45-50 χαρακτήρες.',
        quickFix: {
          label: '✨ Δημιουργία SEO Τίτλου',
          apply: handleOptimizeTitle
        }
      });
    }

    // 2. KEYWORD IN TITLE
    if (keywordStats.inTitle) {
      list.push({
        id: 'kw-in-title',
        category: 'title',
        label: 'Λέξη-Κλειδί στον Τίτλο',
        status: 'pass',
        scoreImpact: 15,
        currentValue: `Περιέχεται («${activeKeyword}»)`,
        targetValue: 'Ναι',
        message: 'Εξαιρετικό! Η κύρια λέξη-κλειδί βρίσκεται στον τίτλο H1.'
      });
    } else {
      list.push({
        id: 'kw-in-title',
        category: 'title',
        label: 'Λέξη-Κλειδί στον Τίτλο',
        status: 'fail',
        scoreImpact: 0,
        currentValue: 'Δεν βρέθηκε',
        targetValue: `«${activeKeyword}»`,
        message: `Η κύρια λέξη-κλειδί («${activeKeyword}») δεν υπάρχει στον τίτλο του άρθρου.`,
        actionSuggestion: 'Ενσωματώστε τη λέξη-κλειδί στο πρώτο μισό του τίτλου.',
        quickFix: {
          label: '🎯 Εισαγωγή στον Τίτλο',
          apply: handleOptimizeTitle
        }
      });
    }

    // 3. META DESCRIPTION LENGTH AUDIT (Summary)
    const summaryLen = summary.length;
    if (summaryLen >= 120 && summaryLen <= 160) {
      list.push({
        id: 'meta-desc-len',
        category: 'description',
        label: 'Μήκος Meta Description',
        status: 'pass',
        scoreImpact: 15,
        currentValue: `${summaryLen} χαρακτήρες`,
        targetValue: '120 - 160 χαρακτήρες',
        message: 'Ιδανικό μήκος περιγραφής για Google SERP (desktop & mobile snippet).'
      });
    } else if (summaryLen >= 80 && summaryLen < 120) {
      list.push({
        id: 'meta-desc-len',
        category: 'description',
        label: 'Μήκος Meta Description',
        status: 'warning',
        scoreImpact: 9,
        currentValue: `${summaryLen} χαρακτήρες`,
        targetValue: '120 - 160 χαρακτήρες',
        message: 'Η περίληψη είναι λίγο σύντομη. Προσθέστε περισσότερες λεπτομέρειες και παρότρυνση σε δράση.',
        quickFix: {
          label: '✨ Αυτόματος Εμπλουτισμός Meta',
          apply: handleOptimizeSummary
        }
      });
    } else if (summaryLen > 160) {
      list.push({
        id: 'meta-desc-len',
        category: 'description',
        label: 'Μήκος Meta Description',
        status: 'warning',
        scoreImpact: 8,
        currentValue: `${summaryLen} χαρακτήρες`,
        targetValue: '120 - 160 χαρακτήρες',
        message: 'Η περίληψη υπερβαίνει τους 160 χαρακτήρες και θα περικοπεί στις μηχανές αναζήτησης.',
        quickFix: {
          label: '✂️ Προσαρμογή σε 155 chars',
          apply: handleOptimizeSummary
        }
      });
    } else {
      list.push({
        id: 'meta-desc-len',
        category: 'description',
        label: 'Μήκος Meta Description',
        status: 'fail',
        scoreImpact: 0,
        currentValue: `${summaryLen} χαρακτήρες`,
        targetValue: '120 - 160 χαρακτήρες',
        message: 'Πολύ μικρή περιγραφή (<80 χαρακτήρες). Οι μηχανές αναζήτησης ενδέχεται να αγνοήσουν το snippet.',
        quickFix: {
          label: '✨ Δημιουργία Πλήρους Meta',
          apply: handleOptimizeSummary
        }
      });
    }

    // 4. KEYWORD IN META DESCRIPTION
    if (keywordStats.inSummary) {
      list.push({
        id: 'kw-in-meta',
        category: 'description',
        label: 'Λέξη-Κλειδί στην Περιγραφή',
        status: 'pass',
        scoreImpact: 10,
        currentValue: 'Εντοπίστηκε',
        targetValue: `«${activeKeyword}»`,
        message: 'Η λέξη-κλειδί εμφανίζεται στην περιγραφή και θα εμφανιστεί με έντονη γραφή στα Google αποτελέσματα.'
      });
    } else {
      list.push({
        id: 'kw-in-meta',
        category: 'description',
        label: 'Λέξη-Κλειδί στην Περιγραφή',
        status: 'fail',
        scoreImpact: 0,
        currentValue: 'Δεν βρέθηκε',
        targetValue: `«${activeKeyword}»`,
        message: `Η περίληψη δεν περιέχει τη λέξη-κλειδί («${activeKeyword}»).`,
        quickFix: {
          label: '✨ Εισαγωγή Keyword στην Περιγραφή',
          apply: handleOptimizeSummary
        }
      });
    }

    // 5. CALL TO ACTION (CTA) IN META DESCRIPTION
    const hasCta = /(μάθετε|δείτε|ανακαλύψτε|διαβάστε|οδηγός|συμβουλές|βήμα-βήμα|πώς να|προστατέψτε|εφαρμόστε|υπολογίστε)/i.test(summary);
    if (hasCta) {
      list.push({
        id: 'cta-in-meta',
        category: 'description',
        label: 'Call to Action (CTA) στο Snippet',
        status: 'pass',
        scoreImpact: 8,
        currentValue: 'Ενεργό',
        targetValue: 'Προτρεπτική φράση',
        message: 'Περιλαμβάνει ισχυρή παρότρυνση σε δράση που αυξάνει το organic click-through rate.'
      });
    } else {
      list.push({
        id: 'cta-in-meta',
        category: 'description',
        label: 'Call to Action (CTA) στο Snippet',
        status: 'warning',
        scoreImpact: 4,
        currentValue: 'Απουσιάζει',
        targetValue: 'π.χ. «Μάθετε πώς», «Δείτε τον οδηγό»',
        message: 'Προσθέστε μια προτροπή (π.χ. "Μάθετε βήμα-βήμα", "Δείτε τις αναλυτικές δόσεις") για +35% CTR.',
        quickFix: {
          label: '✨ Προσθήκη CTA',
          apply: handleOptimizeSummary
        }
      });
    }

    // 6. KEYWORD DENSITY AUDIT
    if (keywordStats.density >= 0.8 && keywordStats.density <= 2.5) {
      list.push({
        id: 'kw-density',
        category: 'keywords',
        label: 'Πυκνότητα Λέξης-Κλειδιού (Density)',
        status: 'pass',
        scoreImpact: 15,
        currentValue: `${keywordStats.density}% (${keywordStats.contentCount} φορές)`,
        targetValue: '0.8% - 2.5%',
        message: `Ιδανική φυσική πυκνότητα (${keywordStats.density}%). Αποφεύγεται ο κίνδυνος keyword stuffing.`
      });
    } else if (keywordStats.density < 0.8) {
      list.push({
        id: 'kw-density',
        category: 'keywords',
        label: 'Πυκνότητα Λέξης-Κλειδιού (Density)',
        status: 'warning',
        scoreImpact: 6,
        currentValue: `${keywordStats.density}% (${keywordStats.contentCount} φορές)`,
        targetValue: '0.8% - 2.5%',
        message: `Χαμηλή πυκνότητα (${keywordStats.density}%). Συμπεριλάβετε τη λέξη «${activeKeyword}» σε περισσότερες ενότητες του κειμένου.`,
        actionSuggestion: 'Προσθέστε τη λέξη-κλειδί 3-5 φορές ακόμα στο κυρίως κείμενο.'
      });
    } else {
      list.push({
        id: 'kw-density',
        category: 'keywords',
        label: 'Πυκνότητα Λέξης-Κλειδιού (Density)',
        status: 'warning',
        scoreImpact: 5,
        currentValue: `${keywordStats.density}% (${keywordStats.contentCount} φορές)`,
        targetValue: '0.8% - 2.5%',
        message: `Υπερβολικά υψηλή πυκνότητα (${keywordStats.density}%). Κίνδυνος ποινής υπερ-βελτιστοποίησης (over-optimization).`,
        actionSuggestion: 'Αντικαταστήστε μερικές επαναλήψεις με συνώνυμα ή παραφράσεις.'
      });
    }

    // 7. KEYWORD IN INTRODUCTION (FIRST 100 WORDS)
    if (keywordStats.inIntro) {
      list.push({
        id: 'kw-in-intro',
        category: 'keywords',
        label: 'Λέξη-Κλειδί στην Εισαγωγή',
        status: 'pass',
        scoreImpact: 8,
        currentValue: 'Εντοπίστηκε',
        targetValue: 'Πρώτες 100 λέξεις',
        message: 'Η λέξη-κλειδί εμφανίζεται στην αρχή του άρθρου, επιβεβαιώνοντας άμεσα το search intent στον αναγνώστη.'
      });
    } else {
      list.push({
        id: 'kw-in-intro',
        category: 'keywords',
        label: 'Λέξη-Κλειδί στην Εισαγωγή',
        status: 'warning',
        scoreImpact: 3,
        currentValue: 'Δεν βρέθηκε',
        targetValue: 'Πρώτες 100 λέξεις',
        message: 'Συνιστάται η αναφορά της κύριας λέξης-κλειδιού στην πρώτη παράγραφο του άρθρου.',
        quickFix: onUpdateContent
          ? {
              label: '🎯 Εισαγωγή στην 1η Παράγραφο',
              apply: handleInjectKeywordInIntro
            }
          : undefined
      });
    }

    // 8. KEYWORD IN SUBHEADINGS (H2 / H3)
    if (keywordStats.inHeadings) {
      list.push({
        id: 'kw-in-headings',
        category: 'content',
        label: 'Λέξη-Κλειδί σε Υποεπικεφαλίδες (H2/H3)',
        status: 'pass',
        scoreImpact: 7,
        currentValue: 'Εντοπίστηκε',
        targetValue: 'Τουλάχιστον 1 επικεφαλίδα',
        message: 'Υπάρχει ενσωμάτωση της λέξης-κλειδιού σε υπότιτλους Markdown.'
      });
    } else {
      list.push({
        id: 'kw-in-headings',
        category: 'content',
        label: 'Λέξη-Κλειδί σε Υποεπικεφαλίδες (H2/H3)',
        status: 'warning',
        scoreImpact: 3,
        currentValue: 'Δεν βρέθηκε',
        targetValue: 'Τουλάχιστον 1 H2/H3',
        message: 'Προσθέστε τη λέξη-κλειδί σε τουλάχιστον μία υποενότητα (π.χ. «## 2. Πώς εφαρμόζεται η ' + activeKeyword + '»).'
      });
    }

    // 9. CONTENT LENGTH & DEPTH
    if (totalWords >= 1200) {
      list.push({
        id: 'content-length',
        category: 'content',
        label: 'Συνολικό Μέγεθος & Βάθος Περιεχομένου',
        status: 'pass',
        scoreImpact: 10,
        currentValue: `${totalWords.toLocaleString()} λέξεις`,
        targetValue: '≥ 1.200 λέξεις (Pillar Content)',
        message: 'Εξαιρετικά αναλυτικό pillar άρθρο! Υψηλή πιθανότητα κατάταξης στο Top 3 των αναζητήσεων.'
      });
    } else if (totalWords >= 600) {
      list.push({
        id: 'content-length',
        category: 'content',
        label: 'Συνολικό Μέγεθος & Βάθος Περιεχομένου',
        status: 'warning',
        scoreImpact: 6,
        currentValue: `${totalWords.toLocaleString()} λέξεις`,
        targetValue: '≥ 1.200 λέξεις',
        message: 'Καλό μέγεθος, αλλά τα κορυφαία γεωπονικά άρθρα αποδίδουν καλύτερα με 1.500+ λέξεις.'
      });
    } else {
      list.push({
        id: 'content-length',
        category: 'content',
        label: 'Συνολικό Μέγεθος & Βάθος Περιεχομένου',
        status: 'fail',
        scoreImpact: 0,
        currentValue: `${totalWords.toLocaleString()} λέξεις`,
        targetValue: '≥ 600 λέξεις',
        message: 'Πολύ σύντομο περιεχόμενο (thin content). Χρησιμοποιήστε το κουμπί «Gemini AI Εμπλουτισμός».'
      });
    }

    // 10. TECHNICAL & STRUCTURED DATA
    const hasImage = Boolean(image && image.startsWith('http'));
    if (hasImage) {
      list.push({
        id: 'tech-image-og',
        category: 'technical',
        label: 'Social & Schema Featured Image',
        status: 'pass',
        scoreImpact: 7,
        currentValue: 'Ορίστηκε HD Εικόνα',
        targetValue: 'Έγκυρο Image URL',
        message: 'Ορίστηκε εικόνα υψηλής ανάλυσης για OpenGraph cards, Twitter preview και Google Discover.'
      });
    } else {
      list.push({
        id: 'tech-image-og',
        category: 'technical',
        label: 'Social & Schema Featured Image',
        status: 'fail',
        scoreImpact: 0,
        currentValue: 'Λείπει',
        targetValue: 'URL Εικόνας',
        message: 'Λείπει η featured εικόνα. Απαραίτητη για εμφάνιση στο Google Discover και στα Social Cards.'
      });
    }

    return list;
  }, [
    title,
    summary,
    content,
    activeKeyword,
    keywordStats,
    totalWords,
    image,
    onUpdateContent
  ]);

  // Overall Score Calculation (0 - 100)
  const totalScore = useMemo(() => {
    const earned = checks.reduce((acc, c) => acc + c.scoreImpact, 0);
    const max = 100;
    return Math.min(100, Math.max(0, Math.round((earned / 100) * 100)));
  }, [checks]);

  const scoreBadge = useMemo(() => {
    if (totalScore >= 85) {
      return {
        label: 'Άριστο SEO (Top Rank Ready)',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/60',
        borderColor: 'border-emerald-500/40',
        ringColor: '#10b981',
        icon: ShieldCheck
      };
    } else if (totalScore >= 65) {
      return {
        label: 'Καλό SEO (Χρειάζεται μικροβελτιώσεις)',
        color: 'text-amber-400',
        bgColor: 'bg-amber-950/60',
        borderColor: 'border-amber-500/40',
        ringColor: '#f59e0b',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Χαμηλό SEO (Απαιτούνται διορθώσεις)',
        color: 'text-rose-400',
        bgColor: 'bg-rose-950/60',
        borderColor: 'border-rose-500/40',
        ringColor: '#f43f5e',
        icon: AlertTriangle
      };
    }
  }, [totalScore]);

  // Filtered check list
  const filteredChecks = useMemo(() => {
    if (filterTab === 'issues') {
      return checks.filter((c) => c.status !== 'pass');
    }
    if (filterTab === 'passed') {
      return checks.filter((c) => c.status === 'pass');
    }
    return checks;
  }, [checks, filterTab]);

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const issueCount = checks.filter((c) => c.status !== 'pass').length;

  return (
    <div id="seo-metadata-auditor" className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl">
      {/* Header & Overall Score Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                SEO Metadata Auditor
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wide uppercase">
                  Real-Time Engine
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ζωντανός έλεγχος μήκους τίτλου, meta description ποιότητας, πυκνότητας keywords και Google SERP προσομοίωση.
            </p>
          </div>
        </div>

        {/* Dynamic Circular / Badge Score */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2.5 px-4 rounded-xl shadow-inner">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Circular SVG Gauge */}
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeDasharray={`${totalScore}, 100`}
                  stroke={scoreBadge.ringColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{totalScore}%</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">SEO Score</div>
              <div className={`text-xs font-extrabold ${scoreBadge.color}`}>{scoreBadge.label}</div>
            </div>
          </div>

          {onSave && (
            <button
              onClick={onSave}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Αποθήκευση αλλαγών άρθρου"
            >
              <Check className="w-4 h-4" />
              Αποθήκευση
            </button>
          )}
        </div>
      </div>

      {/* Target Focus Keyword Configuration Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            Κύρια Λέξη-Κλειδί Στόχευσης (Focus Keyword):
          </label>
          <span className="text-[11px] text-slate-400">
            Ενεργή: <strong className="text-emerald-300 font-mono">«{activeKeyword}»</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="π.χ. λίπασμα σιδήρου, αυτόματο πότισμα..."
              value={targetKeywordInput}
              onChange={(e) => setTargetKeywordInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Quick Auto-Detected Keywords Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Προτεινόμενες:</span>
            {extractedKeywords.map((kw, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTargetKeywordInput(kw)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                  activeKeyword.toLowerCase() === kw.toLowerCase()
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Keyword Frequency & Density Pills Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Συνολική Πυκνότητα:</span>
            <span
              className={`font-mono font-bold ${
                keywordStats.density >= 0.8 && keywordStats.density <= 2.5
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {keywordStats.density}%
            </span>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Εμφανίσεις στο Κείμενο:</span>
            <span className="font-mono font-bold text-white">{keywordStats.contentCount} φορές</span>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Στον Τίτλο (H1):</span>
            <span className={`font-bold ${keywordStats.inTitle ? 'text-emerald-400' : 'text-rose-400'}`}>
              {keywordStats.inTitle ? '✅ Ναι' : '❌ Όχι'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Στην Περιγραφή:</span>
            <span className={`font-bold ${keywordStats.inSummary ? 'text-emerald-400' : 'text-rose-400'}`}>
              {keywordStats.inSummary ? '✅ Ναι' : '❌ Όχι'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time SERP Snippet Preview (Google & Social) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Προεπισκόπηση Αποτελεσμάτων Αναζήτησης (SERP Preview)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setPreviewTab('serp')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
                  previewTab === 'serp' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('social')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
                  previewTab === 'social' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Social Card (OG)
              </button>
            </div>

            {previewTab === 'serp' && (
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Προεπισκόπηση Υπολογιστή"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Προεπισκόπηση Κινητού"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Google SERP Preview */}
        {previewTab === 'serp' && (
          <div
            className={`bg-[#202124] text-slate-200 p-4 rounded-xl border border-slate-700/60 font-sans transition-all ${
              previewDevice === 'mobile' ? 'max-w-md mx-auto shadow-2xl' : 'w-full'
            }`}
          >
            {/* SERP URL Breadcrumb & Favicon */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-700/40 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
                🌿
              </div>
              <div className="min-w-0 text-xs text-[#dadce0] truncate">
                <span className="font-semibold text-white">SmartGarden.gr</span>
                <span className="text-[#9aa0a6] text-[11px] ml-1">
                  https://smartgarden.gr › άρθρα › {cleanSlug}
                </span>
              </div>
            </div>

            {/* SERP Title (Google Blue Link) */}
            <h5 className="text-[17px] leading-snug font-medium text-[#8ab4f8] hover:underline cursor-pointer break-words mb-1">
              {title || 'Τίτλος Άρθρου'} | SmartGarden.gr
            </h5>

            {/* SERP Description Snippet */}
            <p className="text-[13px] text-[#bdc1c6] leading-relaxed break-words">
              <span className="text-[#9aa0a6] font-medium mr-1.5">20 Αυγ 2026 —</span>
              {summary || 'Επιστημονικός οδηγός κηπουρικής και βιολογικής φροντίδας από το SmartGarden.gr.'}
            </p>

            {/* Snippet Metrics Footer */}
            <div className="flex items-center justify-between text-[10px] text-[#9aa0a6] mt-3 pt-2 border-t border-slate-700/50 font-mono">
              <span>
                Τίτλος: <strong className="text-slate-200">{title.length}</strong>/65 χαρακτήρες
              </span>
              <span>
                Περιγραφή: <strong className="text-slate-200">{summary.length}</strong>/160 χαρακτήρες
              </span>
              <span className="text-emerald-400 font-sans">
                {previewDevice === 'mobile' ? '📱 Mobile Snippet' : '💻 Desktop Snippet'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Social Media OpenGraph Card Preview */}
        {previewTab === 'social' && (
          <div className="max-w-lg mx-auto bg-slate-950 border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl">
            <div className="h-48 relative bg-slate-900 overflow-hidden">
              <img
                src={image || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80'}
                alt={title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-emerald-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                SMARTGARDEN.GR
              </div>
            </div>
            <div className="p-4 space-y-1.5 bg-slate-900/90">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                SMARTGARDEN.GR • ΕΠΙΣΤΗΜΟΝΙΚΗ ΓΕΩΠΟΝΙΑ
              </div>
              <div className="text-sm font-bold text-white line-clamp-2 leading-snug">{title}</div>
              <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{summary}</div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time SEO Rules Checklist & 1-Click Suggestions */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Αναλυτικός Έλεγχος SEO & Προτάσεις Βελτίωσης
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
                filterTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Όλα ({checks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('issues')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
                filterTab === 'issues' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Προς Διόρθωση ({issueCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('passed')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
                filterTab === 'passed' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Επιτυχή ({passCount})
            </button>
          </div>
        </div>

        {/* Checklist Item Cards */}
        <div className="grid grid-cols-1 gap-2.5">
          {filteredChecks.map((chk) => (
            <div
              key={chk.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                chk.status === 'pass'
                  ? 'bg-slate-900/40 border-emerald-500/20 hover:border-emerald-500/40'
                  : chk.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {chk.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : chk.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{chk.label}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        chk.status === 'pass'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : chk.status === 'warning'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {chk.currentValue}
                    </span>
                    <span className="text-[10px] text-slate-500">Στόχος: {chk.targetValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{chk.message}</p>
                </div>
              </div>

              {/* 1-Click Quick Fix Button if available */}
              {chk.quickFix && (
                <button
                  type="button"
                  onClick={chk.quickFix.apply}
                  className="bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0 hover:scale-105 active:scale-95 self-start sm:self-center"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {chk.quickFix.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Semantic LSI & Secondary Keywords Cloud */}
      {secondaryKeywordsAnalysis.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              Σημασιολογικές Λέξεις-Κλειδιά (LSI & Secondary Terms):
            </span>
            <span className="text-[10px] text-slate-400">Εντοπίστηκαν {secondaryKeywordsAnalysis.length} όροι</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {secondaryKeywordsAnalysis.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setTargetKeywordInput(item.keyword)}
                  className="font-medium text-slate-300 hover:text-emerald-300 cursor-pointer transition-colors"
                  title="Ορισμός ως κύρια λέξη-κλειδί"
                >
                  {item.keyword}
                </button>
                <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                  {item.count}× ({item.density}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fast Action Quick Tools */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Γρήγορες Ενέργειες SEO Βελτιστοποίησης:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOptimizeTitle}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Τέλεια Προσαρμογή Τίτλου
          </button>

          <button
            type="button"
            onClick={handleOptimizeSummary}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            Βελτιστοποίηση Meta Description
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(canonicalUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Αντιγράφηκε URL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                Αντιγραφή Canonical URL
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
