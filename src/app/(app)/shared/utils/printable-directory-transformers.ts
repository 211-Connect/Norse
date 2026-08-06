import { getPrintableDirectoryLocalizedText } from '@/app/(app)/features/printable-directories/utils/getPrintableDirectoryLocalizedText';
import {
  FavoriteResourceOpenApiDto,
  ResourceTranslationOpenApiDto,
  type PrintableDirectoryPreviewResponseDto,
  type PrintableDirectoryPreviewSectionResourceDto,
} from '@/lib/api/generated/data-contracts';

import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import { type Favorite } from '@/app/(app)/shared/store/favorites';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { type Resource } from '@/types/resource';

/**
 * Represents a single item in a printable directory
 */
export type PrintableDirectoryItemData = {
  id: string;
  displayName: string;
  serviceName: string;
  description: string;
  hours: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  transportation: string;
  accessibility: string;
  eligibility: string;
  requiredDocuments: string;
  languages: string;
  fees: string;
};

/**
 * Represents a complete printable directory with header and items
 */
export type PrintableDirectoryData = {
  name: string;
  items: PrintableDirectoryItemData[];
};

/**
 * Cover page content for a sectioned printable directory PDF
 */
export type PrintableDirectoryPdfCoverData = {
  title: string;
  description: string;
  primaryColor?: string | null;
  coverImageUrlFront?: string | null;
  coverImageUrlBack?: string | null;
};

/**
 * Resolved header/footer content for a sectioned printable directory PDF
 */
export type PrintableDirectoryPdfHeaderFooterData = {
  layout: ('text' | 'logo' | 'domain' | 'date')[];
  text: string;
  logoUrl?: string | null;
};

/**
 * A single content section of a sectioned printable directory PDF
 */
export type PrintableDirectoryPdfSectionData = {
  id: string;
  heading: string;
  description: string;
  items: PrintableDirectoryItemData[];
};

/**
 * Full data required to render a sectioned printable directory PDF
 * (cover page, configurable header/footer, booklet padding).
 */
export type PrintableDirectoryPdfData = {
  name: string;
  isBookletLayout: boolean;
  cover: PrintableDirectoryPdfCoverData;
  header: PrintableDirectoryPdfHeaderFooterData;
  footer: PrintableDirectoryPdfHeaderFooterData;
  sections: PrintableDirectoryPdfSectionData[];
};

export function normalizePrintableHours(hours: string): string {
  return hours
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

export function normalizePrintableList(items?: string[] | null): string {
  if (!items?.length) {
    return '';
  }

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
}

function getAddressFromResource(resource: Resource): string {
  const primaryAddress = resource.addresses?.find(
    (address) => address.rank === 1 && address.type === 'physical',
  );

  return formatAddressForDisplay(primaryAddress) ?? resource.address ?? '';
}

const getTranslationStringValue = (
  translation: ResourceTranslationOpenApiDto | undefined,
  key: string,
): string => {
  if (!translation) return '';

  if (key in translation && typeof translation[key] === 'string') {
    return translation[key] ?? '';
  }

  return '';
};

/**
 * Transforms a favorite list with its items into a printable directory format
 */
export function favoriteListToPrintableDirectory(
  favoriteList: {
    name: string;
    favorites?: (Favorite | FavoriteResourceOpenApiDto)[];
  },
  locale: string,
): PrintableDirectoryData {
  return {
    name: favoriteList.name,
    items:
      favoriteList.favorites?.map((favorite) => {
        const translation = favorite.translations?.find(
          (translationItem) => translationItem.locale === locale,
        );
        const primaryAddress = favorite.addresses?.find(
          (address) => address.rank === 1 && address.type === 'physical',
        );

        return {
          id: favorite._id,
          displayName: translation?.displayName ?? favorite.displayName ?? '',
          serviceName: translation?.serviceName ?? '',
          description: translation?.serviceDescription ?? '',
          hours: normalizePrintableHours(translation?.hours ?? ''),
          address: formatAddressForDisplay(primaryAddress) ?? '',
          phone: favorite.displayPhoneNumber ?? '',
          email: favorite.email ?? '',
          website: favorite.website ?? '',
          transportation: getTranslationStringValue(
            translation,
            'transportation',
          ),
          accessibility: getTranslationStringValue(
            translation,
            'accessibility',
          ),
          eligibility: getTranslationStringValue(translation, 'eligibilities'),
          requiredDocuments:
            translation &&
            'requiredDocuments' in translation &&
            Array.isArray(translation?.requiredDocuments)
              ? normalizePrintableList(translation?.requiredDocuments)
              : '',
          languages:
            translation &&
            'languages' in translation &&
            Array.isArray(translation.languages)
              ? normalizePrintableList(translation?.languages)
              : '',
          fees: translation?.fees ?? '',
        };
      }) ?? [],
  };
}

/**
 * Transforms resources into a printable directory format
 */
export function resourcesToPrintableDirectory(
  resources: Resource[],
  locale: string,
  listName: string,
): PrintableDirectoryData {
  return {
    name: listName,
    items: resources.map((resource) => {
      const translation = resource.translations?.find(
        (translationItem) => translationItem.locale === locale,
      );

      return {
        id: resource.id,
        displayName: translation?.displayName ?? resource.name ?? '',
        serviceName: translation?.serviceName ?? resource.serviceName ?? '',
        description:
          translation?.serviceDescription ?? resource.description ?? '',
        hours: normalizePrintableHours(
          translation?.hours ?? resource.hours ?? '',
        ),
        address: getAddressFromResource(resource),
        phone: resource.phone ?? '',
        email: resource.email ?? '',
        website: resource.website ?? '',
        transportation:
          translation?.transportation ?? resource.transportation ?? '',
        accessibility:
          translation?.accessibility ?? resource.accessibility ?? '',
        eligibility: translation?.eligibilities ?? resource.eligibilities ?? '',
        requiredDocuments: normalizePrintableList(
          translation?.requiredDocuments ?? resource.requiredDocuments,
        ),
        languages: normalizePrintableList(
          translation?.languages ?? resource.languages,
        ),
        fees: translation?.fees ?? resource.fees ?? '',
      };
    }),
  };
}

/**
 * Transforms lightweight search result records into a printable directory format
 */
export function resultsToPrintableDirectory(
  results: ResultType[],
  listName: string,
): PrintableDirectoryData {
  return {
    name: listName,
    items: results.map((result) => ({
      id: result.id ?? result._id,
      displayName: result.name ?? '',
      serviceName: result.serviceName ?? '',
      description: result.description ?? '',
      hours: '',
      address: result.address ?? '',
      phone: result.phone ?? '',
      email: '',
      website: result.website ?? '',
      transportation: '',
      accessibility: '',
      eligibility: '',
      requiredDocuments: '',
      languages: '',
      fees: '',
    })),
  };
}

// NOTE: `ResourceTranslationOpenApiDto` (used by the preview endpoint) does
// not currently expose `transportation`, `accessibility`, `eligibilities` or
// `requiredDocuments` - these render as empty strings until the API adds them.
function previewResourceToItemData(
  entry: PrintableDirectoryPreviewSectionResourceDto,
): PrintableDirectoryItemData {
  const { resource } = entry;
  const translation = resource.translation;
  const primaryAddress = resource.addresses?.find(
    (address) => address.rank === 1 && address.type === 'physical',
  );

  return {
    id: resource._id,
    displayName: translation?.displayName ?? resource.displayName ?? '',
    serviceName: translation?.serviceName ?? '',
    description: translation?.serviceDescription ?? '',
    hours: normalizePrintableHours(translation?.hours ?? ''),
    address: formatAddressForDisplay(primaryAddress) ?? '',
    phone: resource.displayPhoneNumber ?? '',
    email: resource.email ?? '',
    website: resource.website ?? '',
    transportation: '',
    accessibility: '',
    eligibility: '',
    requiredDocuments: '',
    languages: normalizePrintableList(resource.languages),
    fees: translation?.fees ?? '',
  };
}

/**
 * Transforms a printable directory preview response into the data shape
 * consumed by `PDFPrintableDirectory` (cover, header/footer, sections).
 */
export function printableDirectoryPreviewToPdfData(
  preview: PrintableDirectoryPreviewResponseDto,
  locale: string,
): PrintableDirectoryPdfData {
  return {
    name: preview.name,
    isBookletLayout: preview.isBookletLayout,
    cover: {
      title:
        getPrintableDirectoryLocalizedText(
          preview.cover.titleLocalized,
          locale,
        ) || preview.name,
      description: getPrintableDirectoryLocalizedText(
        preview.cover.descriptionLocalized,
        locale,
      ),
      primaryColor: preview.cover.primaryColor,
      coverImageUrlFront: preview.cover.coverImageUrlFront,
      coverImageUrlBack: preview.cover.coverImageUrlBack,
    },
    header: {
      layout: preview.header.layout,
      text: getPrintableDirectoryLocalizedText(
        preview.header.textLocalized,
        locale,
      ),
      logoUrl: preview.header.logoUrl,
    },
    footer: {
      layout: preview.footer.layout,
      text: getPrintableDirectoryLocalizedText(
        preview.footer.textLocalized,
        locale,
      ),
      logoUrl: preview.footer.logoUrl,
    },
    sections: preview.sections.map((section) => ({
      id: section.id,
      heading: section.resolvedHeading,
      description: section.resolvedDescription,
      items: section.resources.map(previewResourceToItemData),
    })),
  };
}
