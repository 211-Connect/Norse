import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import { type FavoriteListWithFavorites } from '@/app/(app)/shared/store/favorites';
import { type Resource } from '@/types/resource';

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

export type PrintableDirectoryData = {
  name: string;
  items: PrintableDirectoryItemData[];
};

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
