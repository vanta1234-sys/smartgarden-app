import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleMarkdownProps {
  content: string;
}

/**
 * The body of an article. Its look lives in `.sg-prose` (src/index.css), so the sizes, the measure and the colours are decided in one
 * place; the elements here only say what each piece of markdown is. Redesigned 2026-10-20: 18px text, one 65-character column, flat tables.
 */
export const ArticleMarkdown: React.FC<ArticleMarkdownProps> = ({ content }) => {
  return (
    <div className="sg-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          // A figure cannot live inside a <p>, and ReactMarkdown wraps a lone image in one.
          p: ({ children }) => <div className="sg-p">{children}</div>,
          strong: ({ children }) => <strong>{children}</strong>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          // a markdown rule is a pause between sections, not a drawn line: a spacer with the separator role
          hr: () => <div role="separator" className="sg-sep" />,
          // The only images in an article body are our own garden photographs, inserted by
          // insertRealPhoto. The caption says so, because that is the whole point of them.
          img: ({ src, alt }) => (
            <figure>
              <img
                src={typeof src === 'string' ? src : ''}
                alt={alt || ''}
                width={900}
                height={675}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                {alt} — δική μας φωτογραφία από τον κήπο μας, Σεπτέμβριος 2026.
              </figcaption>
            </figure>
          ),
          em: ({ children }) => <em>{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="sg-table">
              <table>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
