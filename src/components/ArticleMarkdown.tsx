import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleMarkdownProps {
  content: string;
}

export const ArticleMarkdown: React.FC<ArticleMarkdownProps> = ({ content }) => {
  return (
    <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-emerald-300 mt-6 mb-2 first:mt-0">{children}</h2>,
          h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-emerald-300 mt-6 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-emerald-400 mt-4 mb-2">{children}</h3>,
          // A figure cannot live inside a <p>, and ReactMarkdown wraps a lone image in one.
          p: ({ children }) => <div className="mb-3">{children}</div>,
          strong: ({ children }) => <strong className="font-bold text-slate-100">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 ml-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-1">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300">{children}</li>,
          hr: () => <hr className="border-slate-800 my-4" />,
          // The only images in an article body are our own garden photographs, inserted by
          // insertRealPhoto. The caption says so, because that is the whole point of them.
          img: ({ src, alt }) => (
            <figure className="my-5">
              <img
                src={typeof src === 'string' ? src : ''}
                alt={alt || ''}
                width={900}
                height={675}
                loading="lazy"
                decoding="async"
                className="w-full rounded-xl border border-slate-800"
              />
              <figcaption className="text-[11px] text-slate-500 mt-1.5">
                {alt} — δική μας φωτογραφία, Σεπτέμβριος 2026.
              </figcaption>
            </figure>
          ),
          em: ({ children }) => <em className="italic text-slate-400">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-800">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-900">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-bold text-emerald-300 px-3 py-2 border-b border-slate-800 whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2 border-b border-slate-900 text-slate-300">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
