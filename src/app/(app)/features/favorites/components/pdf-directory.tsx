import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import { type PrintableDirectoryData } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';

import { PDFHtmlRenderer } from './pdf-html-renderer';

// Disable hyphenation for all fonts to prevent word breaking issues
Font.registerHyphenationCallback((word) => [word]);

// Color constants
const COLORS = {
  primary: '#000',
  secondary: '#444',
  tertiary: '#666',
} as const;
const ITEM_GAP = 6;

/**
 * Clock icon for displaying hours - converted from lucide-react to react-pdf Svg
 */
function ClockIcon({ size = 10 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ marginRight: 4 }}
    >
      <Path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"
        stroke={COLORS.secondary}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M12 6v6l4 2"
        stroke={COLORS.secondary}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    paddingTop: 85,
    paddingBottom: 100,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 50,
    right: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  headerMeta: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'Helvetica',
  },
  headerDomain: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  headerSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    height: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tertiary,
  },
  content: {
    flex: 1,
  },
  item: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  itemDisplayName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  itemContent: {
    paddingLeft: 24,
  },
  itemServiceName: {
    fontSize: 11,
    marginTop: ITEM_GAP,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  itemColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLeftColumn: {
    flex: 1,
    paddingRight: 20,
  },
  itemRightColumn: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  itemAddress: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: ITEM_GAP,
  },
  itemHoursRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: ITEM_GAP,
  },
  itemHours: {
    fontSize: 10,
    color: COLORS.primary,
  },
  itemWebsite: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: ITEM_GAP,
    textDecoration: 'underline',
  },
  itemPhone: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: ITEM_GAP,
  },
  itemEmail: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: ITEM_GAP,
  },
  itemDescription: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: ITEM_GAP,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  footerLogo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  footerText: {
    fontSize: 8,
    color: COLORS.secondary,
    flex: 1,
    lineHeight: 1.25,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.secondary,
  },
});

type PDFDirectoryItemProps = {
  item: PrintableDirectoryData['items'][number];
  variant: 'phone-book' | 'all-info';
};

function PDFDirectoryItem({ item, variant }: PDFDirectoryItemProps) {
  // Remove service name from display name if it's duplicated at the end
  const displayName =
    item.displayName &&
    item.serviceName &&
    item.displayName.endsWith(item.serviceName)
      ? item.displayName
          .slice(0, -item.serviceName.length)
          .trim()
          .replace(/[-–—]\s*$/, '')
          .trim()
      : item.displayName;

  // Show domain only if URL is longer than 80 characters to prevent overflow
  let truncatedWebsite = item.website;
  if (item.website && item.website.length > 80) {
    try {
      const url = new URL(
        item.website.startsWith('http')
          ? item.website
          : `https://${item.website}`,
      );
      truncatedWebsite = url.hostname;
    } catch {
      // If URL parsing fails, keep original
      truncatedWebsite = item.website;
    }
  }

  return (
    <View style={styles.item} wrap={false}>
      {displayName && <Text style={styles.itemDisplayName}>{displayName}</Text>}

      <View style={styles.itemContent}>
        {item.serviceName && (
          <Text style={styles.itemServiceName}>{item.serviceName}</Text>
        )}

        <View style={styles.itemColumns}>
          <View style={styles.itemLeftColumn}>
            {item.address && (
              <Text style={styles.itemAddress}>{item.address}</Text>
            )}

            {item.hours && (
              <View style={styles.itemHoursRow}>
                <ClockIcon size={10} />
                <Text style={styles.itemHours}>{item.hours}</Text>
              </View>
            )}

            {truncatedWebsite && (
              <Text style={styles.itemWebsite}>{truncatedWebsite}</Text>
            )}
          </View>

          <View style={styles.itemRightColumn}>
            {item.phone && <Text style={styles.itemPhone}>{item.phone}</Text>}

            {item.email && <Text style={styles.itemEmail}>{item.email}</Text>}
          </View>
        </View>

        {variant === 'all-info' && item.description && (
          <View>
            <PDFHtmlRenderer
              html={item.description}
              style={styles.itemDescription}
            />
          </View>
        )}
      </View>
    </View>
  );
}

type PDFDirectoryProps = {
  /** The directory data to render */
  data: PrintableDirectoryData;
  /** Print format variant: 'phone-book' (contact info only) or 'all-info' (includes descriptions) */
  variant: 'phone-book' | 'all-info';
  /** Current domain to display in header */
  currentDomain: string;
  /** Current date to display in header (formatted as MM/DD/YYYY) */
  currentDate: string;
  /** Optional brand logo URL for footer */
  brandLogoUrl?: string;
  /** Footer disclaimer text */
  disclaimerText: string;
};

/**
 * Main PDF directory component that renders a printable directory document
 * with repeating headers, footers, and page numbers on each page
 */
export function PDFDirectory({
  data,
  variant,
  currentDomain,
  currentDate,
  brandLogoUrl,
  disclaimerText,
}: PDFDirectoryProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Fixed header on every page */}
        <View style={styles.header} fixed>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{data.name}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerDate}>{currentDate}</Text>
              <Text style={styles.headerDomain}>{currentDomain}</Text>
            </View>
          </View>
          <View style={styles.headerSeparator} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {data.items.map((item) => (
            <PDFDirectoryItem key={item.id} item={item} variant={variant} />
          ))}
        </View>

        {/* Fixed footer on every page */}
        <View style={styles.footer} fixed>
          {brandLogoUrl && (
            <Image style={styles.footerLogo} src={brandLogoUrl} />
          )}
          <Text style={styles.footerText}>{disclaimerText}</Text>
        </View>

        {/* Page numbers on every page */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
