import { Font, StyleSheet, Styles, Text, View } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';

import { type PrintableDirectoryItemData } from '@/app/(app)/shared/utils/printable-directory-transformers';

import {
  addLineBreaksToLongWords,
  toPdfPrintableText,
} from './pdf-text-normalizer';

export type PdfStyle = Styles[string];

Font.registerHyphenationCallback((word) => [word]);

export const COLORS = {
  primary: '#000',
  secondary: '#444',
  tertiary: '#888',
} as const;

export const BASE_FONT = {
  title: 16,
  heading: 12,
  subtitle: 11,
  body: 10,
  small: 8,
} as const;

const DATUM_LABEL_WIDTH = 72;

export type PrintVariant = 'line-listing' | 'summary-listing' | 'full-listing';
export type FontSizeMode = 'default' | 'large';

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

export function useDatumLabels(): DatumLabels {
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

export const itemStyles = StyleSheet.create({
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
  fullItem: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
});

export function getFontScale(mode: FontSizeMode): number {
  return mode === 'large' ? 2 : 1;
}

export function scaleStyle(
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
  const scaledStyle = scaleStyle(itemStyles.datumLabel, fontScale, true);

  if (fontScale > 1 && typeof scaledStyle.width === 'number') {
    return {
      ...scaledStyle,
      width: scaledStyle.width + 8,
    };
  }

  return scaledStyle;
}

export function formatWebsiteForDisplay(
  value: string,
  variant: PrintVariant,
): string {
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

export function getDisplayTitleAndSubtitle(item: PrintableDirectoryItemData): {
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

export function PrintDatum({
  label,
  value,
  isPhone = false,
  fontScale,
}: PrintDatumProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={itemStyles.datumRow} wrap={false}>
      <Text style={getDatumLabelStyle(fontScale)}>{label}</Text>
      <Text
        style={scaleStyle(
          isPhone ? itemStyles.datumPhoneValue : itemStyles.datumValue,
          fontScale,
        )}
      >
        {addLineBreaksToLongWords(value)}
      </Text>
    </View>
  );
}

type LineListingItemProps = {
  item: PrintableDirectoryItemData;
  fontScale: number;
};

export function LineListingItem({ item, fontScale }: LineListingItemProps) {
  const itemTitle = item.displayName || item.serviceName;

  return (
    <View style={itemStyles.lineItemBase} wrap={false}>
      {itemTitle && (
        <Text style={scaleStyle(itemStyles.lineItemTitle, fontScale)}>
          {itemTitle}
        </Text>
      )}

      <View style={itemStyles.lineItemDetailRow}>
        <Text style={scaleStyle(itemStyles.lineItemAddress, fontScale)}>
          {addLineBreaksToLongWords(item.address)}
        </Text>
        <Text style={scaleStyle(itemStyles.lineItemPhone, fontScale)}>
          {addLineBreaksToLongWords(item.phone)}
        </Text>
      </View>
    </View>
  );
}

type SummaryListingItemProps = {
  item: PrintableDirectoryItemData;
  labels: DatumLabels;
  fontScale: number;
  showSeparator: boolean;
};

export function SummaryListingItem({
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
          ? itemStyles.summaryItem
          : [itemStyles.summaryItem, itemStyles.summaryItemNoSeparator]
      }
      wrap={false}
    >
      {title && (
        <Text style={scaleStyle(itemStyles.resourceTitle, fontScale)}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={scaleStyle(itemStyles.resourceSubtitle, fontScale)}>
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
  item: PrintableDirectoryItemData;
  labels: DatumLabels;
  fontScale: number;
};

export function FullListingItem({
  item,
  labels,
  fontScale,
}: FullListingItemProps) {
  const { title, subtitle } = getDisplayTitleAndSubtitle(item);
  const printableDescription = toPdfPrintableText(item.description);
  const printableEligibility = toPdfPrintableText(item.eligibility);

  return (
    <View style={itemStyles.fullItem}>
      <View wrap={fontScale > 1}>
        {title && (
          <Text style={scaleStyle(itemStyles.resourceTitle, fontScale)}>
            {title}
          </Text>
        )}

        {subtitle && (
          <Text style={scaleStyle(itemStyles.resourceSubtitle, fontScale)}>
            {subtitle}
          </Text>
        )}

        {printableDescription && (
          <Text style={scaleStyle(itemStyles.resourceDescription, fontScale)}>
            {addLineBreaksToLongWords(printableDescription)}
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
      <PrintDatum
        label={labels.eligibility}
        value={printableEligibility}
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

export function splitItemsIntoColumns<T>(items: T[]): [T[], T[]] {
  const leftCount = Math.ceil(items.length / 2);
  return [items.slice(0, leftCount), items.slice(leftCount)];
}

export function renderVariantItem(
  item: PrintableDirectoryItemData,
  variant: PrintVariant,
  fontScale: number,
  labels: DatumLabels,
  showSeparator: boolean,
) {
  if (variant === 'line-listing') {
    return <LineListingItem key={item.id} item={item} fontScale={fontScale} />;
  }

  if (variant === 'summary-listing') {
    return (
      <SummaryListingItem
        key={item.id}
        item={item}
        labels={labels}
        fontScale={fontScale}
        showSeparator={showSeparator}
      />
    );
  }

  return (
    <FullListingItem
      key={item.id}
      item={item}
      labels={labels}
      fontScale={fontScale}
    />
  );
}
