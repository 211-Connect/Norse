import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  type PrintableDirectoryPdfData,
  type PrintableDirectoryPdfHeaderFooterData,
} from '@/app/(app)/shared/utils/printable-directory-transformers';

import {
  BASE_FONT,
  COLORS,
  getFontScale,
  itemStyles,
  renderVariantItem,
  splitItemsIntoColumns,
  useDatumLabels,
  type FontSizeMode,
  type PdfStyle,
  type PrintVariant,
} from './pdf-print-primitives';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    paddingTop: 85,
    paddingBottom: 100,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  coverImagePage: {
    flexDirection: 'column',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTitle: {
    fontSize: BASE_FONT.title * 2,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  coverDescription: {
    fontSize: BASE_FONT.heading,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  headerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerFooterRegionLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  headerFooterRegionCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerFooterRegionRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  headerFooterTextCentered: {
    fontSize: BASE_FONT.small,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 40,
    right: 40,
  },
  headerSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    height: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tertiary,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  headerFooterText: {
    fontSize: BASE_FONT.small,
    color: COLORS.secondary,
  },
  headerFooterLogo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  content: {
    flex: 1,
    paddingBottom: 8,
  },
  sectionHeading: {
    fontSize: BASE_FONT.title,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: BASE_FONT.body,
    color: COLORS.secondary,
    marginBottom: 10,
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

type HeaderFooterRowProps = {
  config: PrintableDirectoryPdfHeaderFooterData;
  brandLogoUrl?: string;
  currentDomain: string;
  currentDate: string;
  positionStyle: PdfStyle;
  withSeparator?: boolean;
};

function HeaderFooterRow({
  config,
  brandLogoUrl,
  currentDomain,
  currentDate,
  positionStyle,
  withSeparator = false,
}: HeaderFooterRowProps) {
  const logoUrl = config.logoUrl || brandLogoUrl;

  const renderPiece = (piece: (typeof config.layout)[number]) => {
    if (piece === 'text' && config.text) {
      return (
        <Text key={piece} style={styles.headerFooterText}>
          {config.text}
        </Text>
      );
    }

    if (piece === 'logo' && logoUrl) {
      return (
        <Image key={piece} style={styles.headerFooterLogo} src={logoUrl} />
      );
    }

    if (piece === 'domain') {
      return (
        <Text key={piece} style={styles.headerFooterText}>
          {currentDomain}
        </Text>
      );
    }

    if (piece === 'date') {
      return (
        <Text key={piece} style={styles.headerFooterText}>
          {currentDate}
        </Text>
      );
    }

    return null;
  };

  const textIndex = config.layout.indexOf('text');
  const hasCenteredText = textIndex !== -1 && !!config.text;

  return (
    <View style={positionStyle} fixed>
      {hasCenteredText ? (
        // Split into three equal-width regions so the text is always
        // visually centered, regardless of how wide the logo/domain/date
        // pieces on either side happen to be.
        <View style={styles.headerFooterRow}>
          <View style={styles.headerFooterRegionLeft}>
            {config.layout.slice(0, textIndex).map(renderPiece)}
          </View>
          <View style={styles.headerFooterRegionCenter}>
            <Text style={styles.headerFooterTextCentered}>{config.text}</Text>
          </View>
          <View style={styles.headerFooterRegionRight}>
            {config.layout.slice(textIndex + 1).map(renderPiece)}
          </View>
        </View>
      ) : (
        <View style={styles.headerFooterRow}>
          {config.layout.map(renderPiece)}
        </View>
      )}
      {withSeparator && <View style={styles.headerSeparator} />}
    </View>
  );
}

type PDFPrintableDirectoryProps = {
  data: PrintableDirectoryPdfData;
  variant: PrintVariant;
  fontSizeMode: FontSizeMode;
  currentDomain: string;
  currentDate: string;
  brandLogoUrl?: string;
};

export function PDFPrintableDirectory({
  data,
  variant,
  fontSizeMode,
  currentDomain,
  currentDate,
  brandLogoUrl,
}: PDFPrintableDirectoryProps) {
  const fontScale = getFontScale(fontSizeMode);
  const datumLabels = useDatumLabels();
  const isTwoColumn = fontSizeMode !== 'large' && variant !== 'full-listing';

  // A supplied cover image fully replaces the default title/description
  // layout and is rendered as a full-bleed page. These are computed here so
  // they can be slotted in before and after the content pages below.
  const frontCoverPage = data.cover.coverImageUrlFront ? (
    <Page key="cover-front" size="LETTER" style={styles.coverImagePage}>
      <Image style={styles.coverImage} src={data.cover.coverImageUrlFront} />
    </Page>
  ) : (
    <Page key="cover-front" size="LETTER" style={styles.coverPage}>
      <Text style={styles.coverTitle}>{data.cover.title}</Text>
      {data.cover.description && (
        <Text style={styles.coverDescription}>{data.cover.description}</Text>
      )}
    </Page>
  );

  const backCoverPage = data.cover.coverImageUrlBack ? (
    <Page key="cover-back" size="LETTER" style={styles.coverImagePage}>
      <Image style={styles.coverImage} src={data.cover.coverImageUrlBack} />
    </Page>
  ) : null;

  return (
    <Document>
      {frontCoverPage}

      <Page size="LETTER" style={styles.page}>
        <HeaderFooterRow
          config={data.header}
          brandLogoUrl={brandLogoUrl}
          currentDomain={currentDomain}
          currentDate={currentDate}
          positionStyle={styles.header}
          withSeparator
        />

        <View style={styles.content}>
          {data.sections.map((section) => {
            const [leftItems, rightItems] = splitItemsIntoColumns(
              section.items,
            );
            const renderItem = (
              item: PrintableDirectoryPdfData['sections'][number]['items'][number],
            ) =>
              renderVariantItem(
                item,
                variant,
                fontScale,
                datumLabels,
                fontSizeMode === 'default',
              );

            return (
              <View key={section.id}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                {section.description && (
                  <Text style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                )}

                {isTwoColumn ? (
                  <View style={itemStyles.resourceGridTwoColumns}>
                    <View
                      style={[
                        itemStyles.resourceColumn,
                        itemStyles.resourceColumnLeft,
                      ]}
                    >
                      {leftItems.map(renderItem)}
                    </View>
                    {rightItems.length > 0 && (
                      <View style={itemStyles.resourceColumnSeparator} />
                    )}
                    {rightItems.length > 0 && (
                      <View
                        style={[
                          itemStyles.resourceColumn,
                          itemStyles.resourceColumnRight,
                        ]}
                      >
                        {rightItems.map(renderItem)}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={itemStyles.resourceGridOneColumn}>
                    {section.items.map(renderItem)}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <HeaderFooterRow
          config={data.footer}
          brandLogoUrl={brandLogoUrl}
          currentDomain={currentDomain}
          currentDate={currentDate}
          positionStyle={styles.footer}
        />

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => {
            if (!data.isBookletLayout) {
              return `${pageNumber} / ${totalPages}`;
            }

            // Exclude the front (and, if present, back) cover pages from the
            // numbering shown on content pages.
            const coverPageCount = data.cover.coverImageUrlBack ? 2 : 1;
            return `${pageNumber - 1} / ${totalPages - coverPageCount}`;
          }}
          fixed
        />
      </Page>

      {backCoverPage}
    </Document>
  );
}
