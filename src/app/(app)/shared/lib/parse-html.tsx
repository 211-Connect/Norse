import parse from 'html-react-parser';
import { createLogger } from '@/lib/logger';

const log = createLogger('parse-html');

export function markdownLinksToHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  return text.replace(markdownLinkRegex, (_match, label, url) => {
    return `<a className="text-custom-blue" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
}

export function linkifyHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const parts = text.split(/(<a [^>]+>.*?<\/a>)/gi);

  const urlRegex = /((https?:\/\/|www\.)[^\s<>()]+[^\s<>()\.,;!?])/gi;

  return parts
    .map((part) => {
      if (part.startsWith('<a ') && part.endsWith('</a>')) {
        return part;
      }
      return part.replace(urlRegex, (url) => {
        const href = url.startsWith('www.') ? `https://${url}` : url;
        return `<a className="text-custom-blue" href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
    })
    .join('');
}

export function parseHtml(
  html: string,
  config?: { parseLineBreaks?: boolean },
) {
  if (!(html && typeof html === 'string')) return false;

  html = markdownLinksToHtml(html);
  html = linkifyHtml(html);

  if (config?.parseLineBreaks) {
    html = html.replace(/\n/g, '<br />');
  }

  try {
    const parsedHtml = parse(html);
    return parsedHtml;
  } catch (e) {
    log.error({ err: e }, 'failed to parse HTML');
    return html;
  }
}
