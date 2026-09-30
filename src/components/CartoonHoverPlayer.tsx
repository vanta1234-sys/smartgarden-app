import React from 'react';
import { Article, Language } from '../types';
import { AnimatedShortVideo } from './AnimatedShortVideo';

interface CartoonHoverPlayerProps {
  article: Article;
  isHovered: boolean;
  lang: Language;
  className?: string;
  /** Pass through to AnimatedShortVideo's own priority prop -- true when this instance
   * is the page's LCP candidate (the article modal's cover header), so the image loads
   * eager+high-priority instead of lazy. AnimatedShortVideo already had this mechanism;
   * it just never reached here (found via PageSpeed 2026-09-30: 9.5s LCP, 1.59s of it
   * the browser not even starting the image fetch because it was silently defaulting to
   * loading="lazy" on the one image that's always above the fold on this view). */
  priority?: boolean;
}

export const CartoonHoverPlayer: React.FC<CartoonHoverPlayerProps> = ({
  article,
  isHovered,
  lang,
  className = '',
  priority = false,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatedShortVideo
        title={article.title[lang] || article.title.el}
        category={article.category}
        summary={article.summary[lang] || article.summary.el}
        staticImage={article.image}
        isHovered={isHovered}
        priority={priority}
      />
    </div>
  );
};
