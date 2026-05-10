import type { Components } from 'react-markdown'

/** Block code fences get `language-*` plus `hljs` after highlight. */
const blockCodeClassPattern = /language-|hljs-|\bhljs\b/

export const assistantMarkdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-2 text-lg font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-base font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1 text-sm font-semibold">{children}</h4>,
  hr: () => <hr className="my-3 border-zinc-600" />,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0 marker:text-zinc-400">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0 marker:text-zinc-400">{children}</ol>
  ),
  li: ({ children }) => <li className="[&>p]:mb-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-50">{children}</strong>,
  em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-zinc-600 pl-3 text-zinc-300 last:mb-0">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse border border-zinc-600 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-900">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="border border-zinc-600 px-2 py-1 text-left font-medium text-zinc-100">{children}</th>
  ),
  td: ({ children }) => <td className="border border-zinc-600 px-2 py-1 text-zinc-200">{children}</td>,
  pre: ({ children }) => (
    <pre className="assistant-md-pre mb-2 overflow-x-auto rounded-lg px-3 py-2 font-mono text-sm text-zinc-200 last:mb-0">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = blockCodeClassPattern.test(className ?? '')
    if (isBlock) {
      return (
        <code className={`block whitespace-pre font-mono text-zinc-200 ${className ?? ''}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-200" {...props}>
        {children}
      </code>
    )
  },
}
