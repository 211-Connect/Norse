const BLOCK_ELEMENT_REGEX =
  /<\s*(p|div|ul|ol|li|h1|h2|h3|h4|h5|h6|blockquote|pre|table|section|article|hr)\b/i;
const MARKDOWN_BULLET_REGEX = /^\s*[*-]\s+(.+)$/;

export function normalizeStructuredContent(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const lines = html.split(/\r?\n/);
  const normalizedLines: string[] = [];
  const listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    normalizedLines.push(
      `<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`,
    );
    listItems.length = 0;
  };

  for (const line of lines) {
    const match = line.match(MARKDOWN_BULLET_REGEX);

    if (match) {
      listItems.push(match[1].trim());
      continue;
    }

    flushList();
    normalizedLines.push(line);
  }

  flushList();

  return normalizedLines.join('\n');
}

export function containsBlockElements(html: string): boolean {
  if (!html || typeof html !== 'string') return false;

  return BLOCK_ELEMENT_REGEX.test(normalizeStructuredContent(html));
}
