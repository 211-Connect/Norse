import parse from 'html-react-parser';

export function parseHtml(
  html: string,
  config?: { parseLineBreaks?: boolean },
) {
  if (!(html && typeof html === 'string')) return false;

  if (config?.parseLineBreaks) {
    html = html.replace(/\n/g, '<br />');
  }

  return parse(html);
}
