/**
 * Map common unicode lookalikes to ASCII Markdown punctuation so parsers
 * treat emphasis and bullets the same as human-typed Markdown.
 */
const MARKDOWN_CHARS: Record<number, string> = {
  0xff0a: '*', // FULLWIDTH ASTERISK
  0x2217: '*', // ASTERISK OPERATOR
  0xfe61: '*', // SMALL ASTERISK
  0x2010: '-', // HYPHEN
  0x2011: '-', // NON-BREAKING HYPHEN
  0x2012: '-', // FIGURE DASH
  0x2013: '-', // EN DASH (list-like lines sometimes use these)
}

export function normalizeAssistantMarkdown(content: string): string {
  if (!content) return content

  let out = ''
  for (const char of content) {
    const cp = char.codePointAt(0)!
    const ascii = MARKDOWN_CHARS[cp]
    out += ascii ?? char
  }
  return out
}
