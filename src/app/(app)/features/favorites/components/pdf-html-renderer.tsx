import { Text, View } from '@react-pdf/renderer';
import parse, {
  type DOMNode,
  type Element,
  domToReact,
} from 'html-react-parser';

import { normalizeStructuredContent } from '@/app/(app)/shared/lib/html-helpers';
import {
  linkifyHtml,
  markdownLinksToHtml,
} from '@/app/(app)/shared/lib/parse-html';

/**
 * Extract all text content from a DOM node (recursively)
 */
function extractTextContent(node: any): string {
  if (node.type === 'text') {
    return node.data || '';
  }
  if (node.type === 'tag' && node.children) {
    return node.children
      .map((child: any) => extractTextContent(child))
      .join('');
  }
  return '';
}

/**
 * Renders HTML/Markdown content for PDF using react-pdf components
 * Handles text, links, lists, and basic formatting
 */
export function PDFHtmlRenderer({
  html,
  style,
}: {
  html: string;
  style?: any;
}) {
  if (!html || typeof html !== 'string') return null;

  // Process HTML the same way as parseHtml
  let processed = normalizeStructuredContent(html);

  // SIMPLIFIED APPROACH: Keep link labels but remove URLs
  // Transform [label](url) or [label](-url) -> just "label"
  processed = processed.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove any remaining standalone URLs
  processed = processed.replace(/https?:\/\/[^\s)\]]+/g, '');

  // Clean up extra whitespace but preserve single newlines
  processed = processed.replace(/[ \t]{2,}/g, ' ');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Remove leading dashes and clean up spacing
  processed = processed.replace(/^\s*-+\s*/gm, '');
  processed = processed.replace(/\s+-+\s+/g, ' ');

  processed = markdownLinksToHtml(processed);
  processed = linkifyHtml(processed);

  const options = {
    replace: (node: DOMNode) => {
      if (node.type === 'text') {
        const textData = (node as any).data || '';
        // Clean and trim text
        const cleaned = textData.trim();
        // Always wrap text in Text component for react-pdf
        return cleaned ? <Text>{cleaned} </Text> : null;
      }

      if (node.type !== 'tag') {
        return;
      }

      const element = node as Element;

      // Handle lists
      if (element.name === 'ul' || element.name === 'ol') {
        return (
          <View style={{ marginTop: 2, marginBottom: 2 }}>
            {domToReact(element.children as DOMNode[], options)}
          </View>
        );
      }

      if (element.name === 'li') {
        // Check if list item has content
        const textContent = extractTextContent(element).trim();
        if (!textContent) {
          return null;
        }

        return (
          <View
            style={{
              flexDirection: 'row',
              marginBottom: 2,
              paddingRight: 4,
            }}
            wrap={false}
          >
            <Text style={{ marginRight: 2, paddingLeft: 2, minWidth: 10 }}>
              •
            </Text>
            <Text style={{ flex: 1 }}>
              {domToReact(element.children as DOMNode[], options)}
            </Text>
          </View>
        );
      }

      // Skip links entirely - we removed them in preprocessing
      if (element.name === 'a') {
        return null;
      }

      // Handle paragraphs - create line breaks
      if (element.name === 'p') {
        const textContent = extractTextContent(element).trim();
        if (!textContent) return null;

        return (
          <View style={{ marginBottom: 8 }}>
            <Text>{domToReact(element.children as DOMNode[], options)}</Text>
          </View>
        );
      }

      // Handle divs - create line breaks
      if (element.name === 'div') {
        const textContent = extractTextContent(element).trim();
        if (!textContent) return null;

        return (
          <View style={{ marginBottom: 8 }}>
            <Text>{domToReact(element.children as DOMNode[], options)}</Text>
          </View>
        );
      }

      // Default: pass through
      return;
    },
  };

  try {
    const parsed = parse(processed, options);
    // Don't wrap in Text - return the parsed content directly
    // The content already has proper Text/View wrappers from the options
    return <View style={style}>{parsed}</View>;
  } catch (e) {
    console.error('PDF HTML rendering failed:', e);
    return <Text style={style}>{processed.replace(/<[^>]*>/g, '')}</Text>;
  }
}
