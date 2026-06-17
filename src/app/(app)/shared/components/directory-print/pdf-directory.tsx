import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  Styles,
  View,
} from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';

import { type PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';

type PdfStyle = Styles[string];

Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  primary: '#000',
  secondary: '#444',
  tertiary: '#888',
} as const;

const BASE_FONT = {
  title: 16,
  heading: 12,
  subtitle: 11,
  body: 10,
  small: 8,
} as const;

const DATUM_LABEL_WIDTH = 72;

type PrintVariant = 'line-listing' | 'summary-listing' | 'full-listing';
type FontSizeMode = 'default' | 'large';

type DatumLabels = {
  phone: string;
  hours: string;
  email: string;
  website: string;
  address: string;
  transportation: string;
  accessibility: string;
  eligibility: string;
  requiredDocuments: string;
  languages: string;
  fees: string;
  dial211: string;
};

function useDatumLabels(): DatumLabels {
  const { t } = useTranslation('page-list');

  return {
    phone: t('print_dialog.datum_phone'),
    hours: t('print_dialog.datum_hours'),
    email: t('print_dialog.datum_email'),
    website: t('print_dialog.datum_website'),
    address: t('print_dialog.datum_address'),
    transportation: t('print_dialog.datum_transportation'),
    accessibility: t('print_dialog.datum_accessibility'),
    eligibility: t('print_dialog.datum_eligibility'),
    requiredDocuments: t('print_dialog.datum_required_documents'),
    languages: t('print_dialog.datum_languages'),
    fees: t('print_dialog.datum_fees'),
    dial211: t('print_dialog.dial_211'),
  };
}

const styles = StyleSheet.create({
  pageWithHeader: {
    flexDirection: 'column',
    paddingTop: 85,
    paddingBottom: 100,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
  },
  pageNoHeader: {
    flexDirection: 'column',
    paddingTop: 40,
    paddingBottom: 100,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 40,
    right: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: BASE_FONT.title,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  headerMeta: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: BASE_FONT.subtitle,
    color: COLORS.primary,
    fontFamily: 'Helvetica',
  },
  headerDomain: {
    fontSize: BASE_FONT.subtitle,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  headerSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    height: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tertiary,
  },
  content: {
    flex: 1,
    paddingBottom: 8,
  },
  resourceGridTwoColumns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  resourceColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  resourceColumnLeft: {
    paddingRight: 10,
  },
  resourceColumnRight: {
    paddingLeft: 10,
  },
  resourceColumnSeparator: {
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.tertiary,
    alignSelf: 'stretch',
  },
  resourceGridOneColumn: {
    flexDirection: 'column',
  },
  lineItemBase: {
    paddingTop: 2,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tertiary,
  },
  lineItemTitle: {
    fontSize: BASE_FONT.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  lineItemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  lineItemAddress: {
    fontSize: BASE_FONT.body,
    color: COLORS.secondary,
    flex: 1,
    paddingRight: 12,
  },
  lineItemPhone: {
    fontSize: BASE_FONT.body,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  summaryItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tertiary,
  },
  summaryItemNoSeparator: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 0,
  },
  resourceTitle: {
    fontSize: BASE_FONT.heading,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  resourceSubtitle: {
    fontSize: BASE_FONT.subtitle,
    color: COLORS.secondary,
    marginTop: 2,
  },
  resourceDescription: {
    fontSize: BASE_FONT.body,
    color: COLORS.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  datumRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  datumLabel: {
    width: DATUM_LABEL_WIDTH,
    fontSize: BASE_FONT.body,
    color: COLORS.tertiary,
    paddingRight: 8,
  },
  datumValue: {
    flex: 1,
    fontSize: BASE_FONT.body,
    color: COLORS.primary,
  },
  datumPhoneValue: {
    flex: 1,
    fontSize: BASE_FONT.body,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  fullPageBody: {
    flex: 1,
    flexDirection: 'row',
  },
  fullPageLeftMeta: {
    width: 170,
    paddingRight: 16,
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.tertiary,
    flexDirection: 'column',
  },
  fullPageLeftLogo: {
    width: '100%',
    height: 50,
    objectFit: 'contain',
    marginBottom: 8,
  },
  fullPageLeftLogoSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.tertiary,
    marginBottom: 10,
  },
  fullPageLeftName: {
    fontSize: BASE_FONT.title,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    lineHeight: 1.25,
  },
  fullPageLeftDate: {
    fontSize: BASE_FONT.body,
    color: COLORS.secondary,
  },
  fullPageLeftSpacer: {
    flex: 1,
  },
  fullPageLeftBottomSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.tertiary,
    marginBottom: 8,
  },
  fullPageLeftDial: {
    fontSize: BASE_FONT.heading,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  fullPageLeftDomain: {
    fontSize: BASE_FONT.body,
    color: COLORS.secondary,
  },
  fullPageRightContent: {
    flex: 1,
    flexDirection: 'column',
  },
  fullItem: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  footerWithLogo: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  footerTextOnly: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerLogo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  footerText: {
    fontSize: BASE_FONT.small,
    color: COLORS.secondary,
    flex: 1,
    lineHeight: 1.25,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: BASE_FONT.body,
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.secondary,
  },
});

function getFontScale(mode: FontSizeMode): number {
  return mode === 'large' ? 2 : 1;
}

function scaleStyle(
  baseStyle: PdfStyle,
  fontScale: number,
  scaleWidth?: boolean,
): PdfStyle {
  if (fontScale === 1) {
    return baseStyle;
  }

  const scaledStyle = { ...baseStyle };

  if (typeof baseStyle.fontSize === 'number') {
    scaledStyle.fontSize = baseStyle.fontSize * fontScale;
  }

  if (
    scaleWidth &&
    typeof baseStyle.width === 'number' &&
    baseStyle.width > 0
  ) {
    scaledStyle.width = baseStyle.width * fontScale;
  }

  return scaledStyle;
}

function getDatumLabelStyle(fontScale: number): PdfStyle {
  const scaledStyle = scaleStyle(styles.datumLabel, fontScale, true);

  if (fontScale > 1 && typeof scaledStyle.width === 'number') {
    return {
      ...scaledStyle,
      width: scaledStyle.width + 8,
    };
  }

  return scaledStyle;
}

function formatWebsiteForDisplay(value: string, variant: PrintVariant): string {
  if (!value) return value;

  if (variant === 'summary-listing') {
    try {
      const url = new URL(
        value.startsWith('http') ? value : `https://${value}`,
      );
      return url.hostname.replace(/^www\./i, '');
    } catch {
      return value
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .split('?')[0]
        .trim();
    }
  }

  if (variant === 'full-listing') {
    try {
      const url = new URL(
        value.startsWith('http') ? value : `https://${value}`,
      );
      return (url.hostname + url.pathname).replace(/\/$/, '');
    } catch {
      return value
        .replace(/^https?:\/\//i, '')
        .split('?')[0]
        .trim();
    }
  }

  return value;
}

function normalizeForComparison(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDisplayTitleAndSubtitle(
  item: PrintableDirectoryData['items'][number],
): {
  title: string;
  subtitle: string;
} {
  const title = item.displayName;
  const subtitle = item.serviceName;

  const normalizedTitle = normalizeForComparison(title);
  const normalizedSubtitle = normalizeForComparison(subtitle);

  if (!normalizedTitle || !normalizedSubtitle) {
    return { title, subtitle };
  }

  if (!normalizedTitle.includes(normalizedSubtitle)) {
    return { title, subtitle };
  }

  const escapedSubtitle = normalizeForComparison(subtitle)
    .split(' ')
    .map((part) => escapeRegExp(part))
    .join('\\s+');

  const cleanedTitle = title
    .replace(new RegExp(escapedSubtitle, 'ig'), ' ')
    .replace(/\s*[|,;:\-–—]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleanedTitle) {
    return { title: subtitle, subtitle: '' };
  }

  return {
    title: cleanedTitle,
    subtitle,
  };
}

type PrintDatumProps = {
  label: string;
  value: string;
  isPhone?: boolean;
  fontScale: number;
};

type PrintDatumHtmlProps = {
  label: string;
  value: string;
  fontScale: number;
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToPrintableText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<a[^>]*href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/!\[([^\]]*)\]\((?:[^)\s]+)(?:\))?/g, '$1')
    .replace(/\[([^\]]+)\]\((?:[^)\s]+)(?:\))?/g, '$1')
    .replace(/\]\((?:https?:\/\/|www\.)[^)\s]+\)?/gi, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}(?:[*+-])\s+/gm, '- ')
    .replace(/^(\s{0,3})\d+\.\s+/gm, '$11. ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1$2')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1$2')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul[^>]*>/gi, '\n')
    .replace(/<\/?ol[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*[-*+]\s*$/gm, '')
    .replace(/\n-\s*\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

function PrintDatumHtml({ label, value, fontScale }: PrintDatumHtmlProps) {
  if (!value) {
    return null;
  }

  const printableValue = htmlToPrintableText(value);

  if (!printableValue) {
    return null;
  }

  return (
    <View style={styles.datumRow}>
      <Text style={getDatumLabelStyle(fontScale)}>{label}</Text>
      <Text style={scaleStyle(styles.datumValue, fontScale)}>
        {printableValue}
      </Text>
    </View>
  );
}

function PrintDatum({
  label,
  value,
  isPhone = false,
  fontScale,
}: PrintDatumProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.datumRow} wrap={false}>
      <Text style={getDatumLabelStyle(fontScale)}>{label}</Text>
      <Text
        style={scaleStyle(
          isPhone ? styles.datumPhoneValue : styles.datumValue,
          fontScale,
        )}
      >
        {value}
      </Text>
    </View>
  );
}

type LineListingItemProps = {
  item: PrintableDirectoryData['items'][number];
  fontScale: number;
};

function LineListingItem({ item, fontScale }: LineListingItemProps) {
  const itemTitle = item.displayName || item.serviceName;

  return (
    <View style={styles.lineItemBase} wrap={false}>
      {itemTitle && (
        <Text style={scaleStyle(styles.lineItemTitle, fontScale)}>
          {itemTitle}
        </Text>
      )}

      <View style={styles.lineItemDetailRow}>
        <Text style={scaleStyle(styles.lineItemAddress, fontScale)}>
          {item.address}
        </Text>
        <Text style={scaleStyle(styles.lineItemPhone, fontScale)}>
          {item.phone}
        </Text>
      </View>
    </View>
  );
}

type SummaryListingItemProps = {
  item: PrintableDirectoryData['items'][number];
  labels: DatumLabels;
  fontScale: number;
  showSeparator: boolean;
};

function SummaryListingItem({
  item,
  labels,
  fontScale,
  showSeparator,
}: SummaryListingItemProps) {
  const { title, subtitle } = getDisplayTitleAndSubtitle(item);

  return (
    <View
      style={
        showSeparator
          ? styles.summaryItem
          : [styles.summaryItem, styles.summaryItemNoSeparator]
      }
      wrap={false}
    >
      {title && (
        <Text style={scaleStyle(styles.resourceTitle, fontScale)}>{title}</Text>
      )}
      {subtitle && (
        <Text style={scaleStyle(styles.resourceSubtitle, fontScale)}>
          {subtitle}
        </Text>
      )}

      <PrintDatum
        label={labels.phone}
        value={item.phone}
        isPhone
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.hours}
        value={item.hours}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.email}
        value={item.email}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.website}
        value={formatWebsiteForDisplay(item.website, 'summary-listing')}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.address}
        value={item.address}
        fontScale={fontScale}
      />
    </View>
  );
}

type FullListingItemProps = {
  item: PrintableDirectoryData['items'][number];
  labels: DatumLabels;
  fontScale: number;
};

function FullListingItem({ item, labels, fontScale }: FullListingItemProps) {
  const { title, subtitle } = getDisplayTitleAndSubtitle(item);
  const printableDescription = item.description
    ? htmlToPrintableText(item.description)
    : '';

  return (
    <View style={styles.fullItem}>
      <View wrap={fontScale > 1}>
        {title && (
          <Text style={scaleStyle(styles.resourceTitle, fontScale)}>
            {title}
          </Text>
        )}

        {subtitle && (
          <Text style={scaleStyle(styles.resourceSubtitle, fontScale)}>
            {subtitle}
          </Text>
        )}

        {printableDescription && (
          <Text style={scaleStyle(styles.resourceDescription, fontScale)}>
            {printableDescription}
          </Text>
        )}
      </View>

      <PrintDatum
        label={labels.phone}
        value={item.phone}
        isPhone
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.hours}
        value={item.hours}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.email}
        value={item.email}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.website}
        value={formatWebsiteForDisplay(item.website, 'full-listing')}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.address}
        value={item.address}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.transportation}
        value={item.transportation}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.accessibility}
        value={item.accessibility}
        fontScale={fontScale}
      />
      <PrintDatumHtml
        label={labels.eligibility}
        value={item.eligibility}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.requiredDocuments}
        value={item.requiredDocuments}
        fontScale={fontScale}
      />
      <PrintDatum
        label={labels.languages}
        value={item.languages}
        fontScale={fontScale}
      />
      <PrintDatum label={labels.fees} value={item.fees} fontScale={fontScale} />
    </View>
  );
}

type DirectoryHeaderProps = {
  listName: string;
  currentDate: string;
  currentDomain: string;
};

function DirectoryHeader({
  listName,
  currentDate,
  currentDomain,
}: DirectoryHeaderProps) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{listName}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerDate}>{currentDate}</Text>
          <Text style={styles.headerDomain}>{currentDomain}</Text>
        </View>
      </View>
      <View style={styles.headerSeparator} />
    </View>
  );
}

type DirectoryFooterProps = {
  disclaimerText: string;
  showLogo: boolean;
  brandLogoUrl?: string;
};

function DirectoryFooter({
  disclaimerText,
  showLogo,
  brandLogoUrl,
}: DirectoryFooterProps) {
  return (
    <View
      style={showLogo ? styles.footerWithLogo : styles.footerTextOnly}
      fixed
    >
      {showLogo && brandLogoUrl && (
        <Image style={styles.footerLogo} src={brandLogoUrl} />
      )}
      <Text style={styles.footerText}>{disclaimerText}</Text>
    </View>
  );
}

function splitItemsIntoColumns<T>(items: T[]): [T[], T[]] {
  const leftCount = Math.ceil(items.length / 2);
  return [items.slice(0, leftCount), items.slice(leftCount)];
}

type PDFDirectoryProps = {
  data: PrintableDirectoryData;
  variant: PrintVariant;
  fontSizeMode: FontSizeMode;
  currentDomain: string;
  currentDate: string;
  brandLogoUrl?: string;
  disclaimerText: string;
};

export function PDFDirectory({
  data,
  variant,
  fontSizeMode,
  currentDomain,
  currentDate,
  brandLogoUrl,
  disclaimerText,
}: PDFDirectoryProps) {
  const fontScale = getFontScale(fontSizeMode);
  const datumLabels = useDatumLabels();

  const useSidebarLayout =
    variant === 'full-listing' && fontSizeMode !== 'large';
  const isTwoColumn = fontSizeMode !== 'large' && variant !== 'full-listing';
  const [leftItems, rightItems] = splitItemsIntoColumns(data.items);

  const renderItem = (item: PrintableDirectoryData['items'][number]) => {
    if (variant === 'line-listing')
      return (
        <LineListingItem key={item.id} item={item} fontScale={fontScale} />
      );
    if (variant === 'summary-listing')
      return (
        <SummaryListingItem
          key={item.id}
          item={item}
          labels={datumLabels}
          fontScale={fontScale}
          showSeparator={fontSizeMode === 'default'}
        />
      );
    return (
      <FullListingItem
        key={item.id}
        item={item}
        labels={datumLabels}
        fontScale={fontScale}
      />
    );
  };

  return (
    <Document>
      <Page
        size="LETTER"
        style={useSidebarLayout ? styles.pageNoHeader : styles.pageWithHeader}
      >
        {!useSidebarLayout && (
          <DirectoryHeader
            listName={data.name}
            currentDate={currentDate}
            currentDomain={currentDomain}
          />
        )}

        {useSidebarLayout ? (
          <View style={styles.fullPageBody}>
            <View style={styles.fullPageLeftMeta} fixed>
              {brandLogoUrl && (
                <Image style={styles.fullPageLeftLogo} src={brandLogoUrl} />
              )}
              <View style={styles.fullPageLeftLogoSeparator} />
              <Text style={scaleStyle(styles.fullPageLeftName, fontScale)}>
                {data.name}
              </Text>
              <Text style={scaleStyle(styles.fullPageLeftDate, fontScale)}>
                {currentDate}
              </Text>
              <View style={styles.fullPageLeftSpacer} />
              <View style={styles.fullPageLeftBottomSeparator} />
              <Text style={scaleStyle(styles.fullPageLeftDial, fontScale)}>
                {datumLabels.dial211}
              </Text>
              <Text style={scaleStyle(styles.fullPageLeftDomain, fontScale)}>
                {currentDomain}
              </Text>
            </View>
            <View style={styles.fullPageRightContent}>
              {data.items.map(renderItem)}
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {isTwoColumn ? (
              <View style={styles.resourceGridTwoColumns}>
                <View
                  style={[styles.resourceColumn, styles.resourceColumnLeft]}
                >
                  {leftItems.map(renderItem)}
                </View>
                {rightItems.length > 0 && (
                  <View style={styles.resourceColumnSeparator} />
                )}
                {rightItems.length > 0 && (
                  <View
                    style={[styles.resourceColumn, styles.resourceColumnRight]}
                  >
                    {rightItems.map(renderItem)}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.resourceGridOneColumn}>
                {data.items.map(renderItem)}
              </View>
            )}
          </View>
        )}

        <DirectoryFooter
          disclaimerText={disclaimerText}
          showLogo={!useSidebarLayout}
          brandLogoUrl={brandLogoUrl}
        />

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
