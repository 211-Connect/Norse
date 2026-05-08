import { createLogger } from '@/lib/logger';
import parse from 'html-react-parser';

import { normalizeStructuredContent } from './html-helpers';

const log = createLogger('parse-html');

export function markdownLinksToHtml(text: string): string {
  if (!text) return '';
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) =>
      `<a className="text-custom-blue" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
}

export function linkifyHtml(text: string): string {
  if (!text) return '';

  const urlRegex = /((https?:\/\/|www\.)[^\s<>()]+[^\s<>()\.,;!?])/gi;

  return text
    .split(/(<a [^>]+>.*?<\/a>)/gi)
    .map((part) => {
      if (part.startsWith('<a ') && part.endsWith('</a>')) return part;
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
  if (!html || typeof html !== 'string') return false;

  html = normalizeStructuredContent(html);
  html = markdownLinksToHtml(html);
  html = linkifyHtml(html);

  if (config?.parseLineBreaks) {
    html = html.replace(/\n/g, '<br />');
  }

  try {
    return parse(`<div class="parsed-html-content">${html}</div>`);
  } catch (e) {
    log.error({ err: e }, 'failed to parse HTML', { html });
    return html;
  }
}
