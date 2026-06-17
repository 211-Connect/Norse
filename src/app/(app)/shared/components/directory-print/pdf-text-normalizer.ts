import { compile } from 'html-to-text';
import removeMarkdown from 'remove-markdown';

const LONG_WORD_MIN_BREAK_LENGTH = 48;
const LONG_WORD_MAX_BREAK_LENGTH = 64;
const LONG_WORD_BREAK = '\n';
const LONG_WORD_BREAK_CHARS = new Set(['/', '?', '&', '-', '=', '#', '_']);

const compiledHtmlToText = compile({
  wordwrap: false,
  preserveNewlines: true,
  unorderedListItemPrefix: '- ',
  selectors: [
    {
      selector: 'a',
      options: {
        hideLinkHrefIfSameAsText: true,
        linkBrackets: [' (', ')'],
        noAnchorUrl: true,
      },
    },
    {
      selector: 'img',
      format: 'skip',
    },
  ],
});

function markdownLinksToHtmlAnchors(value: string): string {
  return value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_full, label, href) => {
    const normalizedHref = href.startsWith('www.') ? `https://${href}` : href;
    return `<a href="${normalizedHref}">${label}</a>`;
  });
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/^\s*[*+]\s+/gm, '- ')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitLongWord(word: string): string[] {
  if (word.length <= LONG_WORD_MIN_BREAK_LENGTH) {
    return [word];
  }

  const parts: string[] = [];
  let start = 0;

  while (start < word.length) {
    const minEnd = Math.min(start + LONG_WORD_MIN_BREAK_LENGTH, word.length);
    const maxEnd = Math.min(start + LONG_WORD_MAX_BREAK_LENGTH, word.length);
    let end = minEnd;

    for (let index = maxEnd - 1; index >= minEnd; index -= 1) {
      if (LONG_WORD_BREAK_CHARS.has(word[index])) {
        end = index + 1;
        break;
      }
    }

    parts.push(word.slice(start, end));
    start = end;
  }

  return parts;
}

export function addLineBreaksToLongWords(value: string): string {
  if (!value) {
    return value;
  }

  return value.replace(
    new RegExp(`\\S{${LONG_WORD_MIN_BREAK_LENGTH + 1},}`, 'g'),
    (word) => splitLongWord(word).join(LONG_WORD_BREAK),
  );
}

export function toPdfPrintableText(value: string): string {
  if (!value) {
    return '';
  }

  const withAnchors = markdownLinksToHtmlAnchors(value.replace(/\r\n?/g, '\n'));
  const htmlAsText = compiledHtmlToText(withAnchors);
  const markdownRemoved = removeMarkdown(htmlAsText, {
    stripListLeaders: false,
    useImgAltText: true,
  });

  return normalizeWhitespace(markdownRemoved);
}
