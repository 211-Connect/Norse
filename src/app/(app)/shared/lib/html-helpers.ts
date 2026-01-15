export function containsBlockElements(html: string): boolean {
  if (!html || typeof html !== 'string') return false;

  return /<\s*(p|div|ul|ol|li|h1|h2|h3|h4|h5|h6|blockquote|pre|table|section|article|hr)\b/i.test(
    html,
  );
}
