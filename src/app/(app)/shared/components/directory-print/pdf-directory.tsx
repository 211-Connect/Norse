import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import { type PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';

import {
  BASE_FONT,
  COLORS,
  getFontScale,
  itemStyles,
  renderVariantItem,
  scaleStyle,
  splitItemsIntoColumns,
  useDatumLabels,
  type FontSizeMode,
  type PrintVariant,
} from './pdf-print-primitives';

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

  const renderItem = (item: PrintableDirectoryData['items'][number]) =>
    renderVariantItem(
      item,
      variant,
      fontScale,
      datumLabels,
      fontSizeMode === 'default',
    );

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
