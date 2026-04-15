const BLOCK_ELEMENT_REGEX =
  /<\s*(p|div|ul|ol|li|h1|h2|h3|h4|h5|h6|blockquote|pre|table|section|article|hr)\b/i;

export function normalizeStructuredContent(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const lines = html.replace(/<br\s*\/?>/gi, '\n').split(/\r?\n/);
  const result: string[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length === 0) return;

    // Remove trailing empty lines before list
    while (result.length > 0 && !result[result.length - 1].trim()) {
      result.pop();
    }

    result.push(
      `<ul>${currentList.map((item) => `<li>${item}</li>`).join('')}</ul>`,
    );
    currentList = [];
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[*-]\s+(.+)$/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1].trim());
    } else {
      const hadList = currentList.length > 0;
      flushList();
      // Skip first empty line after list
      if (hadList && !line.trim()) continue;
      result.push(line);
    }
  }

  flushList();
  return result.join('\n');
}

export function containsBlockElements(html: string): boolean {
  if (!html || typeof html !== 'string') return false;

  return BLOCK_ELEMENT_REGEX.test(normalizeStructuredContent(html));
}
