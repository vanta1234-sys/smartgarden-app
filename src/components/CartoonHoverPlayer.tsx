import React from 'react';
import { Article, Language } from '../types';
import { AnimatedShortVideo } from './AnimatedShortVideo';

interface CartoonHoverPlayerProps {
  article: Article;
  isHovered: boolean;
  lang: Language;
  className?: string;
}

export const CartoonHoverPlayer: React.FC<CartoonHoverPlayerProps> = ({
  article,
  isHovered,
  lang,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatedShortVideo
        title={article.title[lang] || article.title.el}
        category={article.category}
        summary={article.summary[lang] || article.summary.el}
        staticImage={article.image}
        isHovered={isHovered}
      />
    </div>
  );
};
