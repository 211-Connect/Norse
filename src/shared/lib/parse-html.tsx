import parse from 'html-react-parser';

export function parseHtml(
  html: string,
  config?: { parseLineBreaks?: boolean }
) {
  if (config?.parseLineBreaks) {
    html = html.replace(/\n/g, '<br />');
  }

  return parse(html);
}
