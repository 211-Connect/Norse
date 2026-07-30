import { Font } from '@react-pdf/renderer';
import { createContext, useContext, type ReactNode } from 'react';
import { withOptionalCustomBasePath } from '../../lib/utils';

/**
 * The built-in PDF "standard 14" fonts (Helvetica, Times-Roman, Courier)
 * only contain WinAnsi/Latin-1 glyphs. Any text outside that range -
 * Cyrillic (Russian, Ukrainian), CJK (Chinese, Japanese, Korean), etc. -
 * renders as blank boxes, missing characters, or gibberish.
 *
 * This module registers Noto Sans variants that cover the scripts our
 * printable directories are localized into, and exposes a `locale` ->
 * font-family mapping so PDF templates can pick the right one instead of
 * hardcoding 'Helvetica' / 'Helvetica-Bold'.
 */

// Custom fonts don't ship hyphenation dictionaries; disable hyphenation so
// words aren't split incorrectly (or crash) when wrapped.
Font.registerHyphenationCallback((word) => [word]);

type PdfFontFamily = { regular: string; bold: string };

// "latin" (Noto Sans) covers Latin (incl. extended/Vietnamese), Cyrillic,
// and Greek - i.e. every Latin/Cyrillic locale below, plus the fallback for
// any locale not otherwise listed. The rest need a script-specific font for
// glyphs Noto Sans doesn't contain (CJK ideographs/hangul, Arabic, Devanagari,
// Ethiopic, Gujarati, Khmer, Lao, Odia, ...).
const FONT_FAMILY = {
  latin: { regular: 'PdfSans', bold: 'PdfSans-Bold' },
  sc: { regular: 'PdfSansSC', bold: 'PdfSansSC' },
  tc: { regular: 'PdfSansTC', bold: 'PdfSansTC' },
  kr: { regular: 'PdfSansKR', bold: 'PdfSansKR' },
  jp: { regular: 'PdfSansJP', bold: 'PdfSansJP' },
  arabic: { regular: 'PdfSansArabic', bold: 'PdfSansArabic' },
  devanagari: { regular: 'PdfSansDevanagari', bold: 'PdfSansDevanagari' },
  ethiopic: { regular: 'PdfSansEthiopic', bold: 'PdfSansEthiopic' },
  gujarati: { regular: 'PdfSansGujarati', bold: 'PdfSansGujarati' },
  khmer: { regular: 'PdfSansKhmer', bold: 'PdfSansKhmer' },
  lao: { regular: 'PdfSansLao', bold: 'PdfSansLao' },
  oriya: { regular: 'PdfSansOriya', bold: 'PdfSansOriya' },
} as const satisfies Record<string, PdfFontFamily>;

const toSrc = (fileName: string) =>
  withOptionalCustomBasePath(`/fonts/${fileName}.ttf`);

Font.register({
  family: FONT_FAMILY.latin.regular,
  src: toSrc('NotoSans-Regular'),
});
Font.register({
  family: FONT_FAMILY.latin.bold,
  src: toSrc('NotoSans-Bold'),
});
Font.register({
  family: FONT_FAMILY.sc.regular,
  src: toSrc('NotoSansSC-Variable'),
});
Font.register({
  family: FONT_FAMILY.tc.regular,
  src: toSrc('NotoSansTC-Variable'),
});
Font.register({
  family: FONT_FAMILY.kr.regular,
  src: toSrc('NotoSansKR-Variable'),
});
Font.register({
  family: FONT_FAMILY.jp.regular,
  src: toSrc('NotoSansJP-Variable'),
});
// The families below have no separate static Bold file (single variable-
// weight source), so the same file is registered once and reused for both
// the regular and bold family names - bold text in these locales renders at
// regular weight rather than failing to render.
Font.register({
  family: FONT_FAMILY.arabic.regular,
  src: toSrc('NotoSansArabic-Variable'),
});
Font.register({
  family: FONT_FAMILY.devanagari.regular,
  src: toSrc('NotoSansDevanagari-Variable'),
});
Font.register({
  family: FONT_FAMILY.ethiopic.regular,
  src: toSrc('NotoSansEthiopic-Variable'),
});
Font.register({
  family: FONT_FAMILY.gujarati.regular,
  src: toSrc('NotoSansGujarati-Variable'),
});
Font.register({
  family: FONT_FAMILY.khmer.regular,
  src: toSrc('NotoSansKhmer-Variable'),
});
Font.register({
  family: FONT_FAMILY.lao.regular,
  src: toSrc('NotoSansLao-Variable'),
});
Font.register({
  family: FONT_FAMILY.oriya.regular,
  src: toSrc('NotoSansOriya-Variable'),
});

const LOCALE_SCRIPT: Record<string, keyof typeof FONT_FAMILY> = {
  ja: 'jp',
  ko: 'kr',
  yue: 'tc',
  'zh-Hans': 'sc',
  'zh-Hant': 'tc',
  ar: 'arabic',
  fa: 'arabic',
  ps: 'arabic',
  prs: 'arabic',
  hi: 'devanagari',
  ne: 'devanagari',
  am: 'ethiopic',
  gu: 'gujarati',
  km: 'khmer',
  lo: 'lao',
  or: 'oriya',
};

export function getPdfFontFamilyForLocale(locale: string): PdfFontFamily {
  const script = LOCALE_SCRIPT[locale] ?? 'latin';
  return FONT_FAMILY[script];
}

const PdfFontContext = createContext<PdfFontFamily>(FONT_FAMILY.latin);

type PdfFontProviderProps = {
  locale: string;
  children: ReactNode;
};

/**
 * Wrap a PDF `Document` tree with this to make `usePdfFontFamily()`
 * available to every component rendering text for the given locale.
 */
export function PdfFontProvider({ locale, children }: PdfFontProviderProps) {
  return (
    <PdfFontContext.Provider value={getPdfFontFamilyForLocale(locale)}>
      {children}
    </PdfFontContext.Provider>
  );
}

export function usePdfFontFamily(): PdfFontFamily {
  return useContext(PdfFontContext);
}
