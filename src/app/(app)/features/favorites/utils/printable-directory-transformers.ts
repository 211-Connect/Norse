import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import { type FavoriteListWithFavorites } from '@/app/(app)/shared/store/favorites';
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
};

/**
 * Represents a complete printable directory with header and items
 */
export type PrintableDirectoryData = {
  name: string;
  items: PrintableDirectoryItemData[];
};

/**
 * Normalizes multi-line hours text into a single semicolon-separated string
 * suitable for PDF rendering
 *
 * @example
 * normalizePrintableHours("Mon 9-5\nTue 9-5") // "Mon 9-5; Tue 9-5"
 */
function normalizePrintableHours(hours: string): string {
  return hours
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('; ')
    .replace(/(?:\s*;\s*){2,}/g, '; ')
    .replace(/^\s*;\s*|\s*;\s*$/g, '')
    .trim();
}

function getAddressFromResource(resource: Resource): string {
  const primaryAddress = resource.addresses?.find(
    (address) => address.rank === 1 && address.type === 'physical',
  );

  return formatAddressForDisplay(primaryAddress) ?? resource.address ?? '';
}

/**
 * Transforms a favorite list with its items into a printable directory format
 *
 * @param favoriteList - The favorite list containing favorites to print
 * @param locale - The locale for translations (e.g., 'en', 'es')
 * @returns Formatted data ready for PDF generation
 */
export function favoriteListToPrintableDirectory(
  favoriteList: FavoriteListWithFavorites,
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
        };
      }) ?? [],
  };
}

/**
 * Transforms local resources into a printable directory format
 *
 * @param resources - Array of resources to include in the directory
 * @param locale - The locale for translations (e.g., 'en', 'es')
 * @param listName - The name to display in the directory header
 * @returns Formatted data ready for PDF generation
 */
export function localResourcesToPrintableDirectory(
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
      };
    }),
  };
}
