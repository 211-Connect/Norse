import { ResourceDirectory } from '@/payload/payload-types';
import { AppConfig } from '@/types/appConfig';

type CustomMenuItem = NonNullable<
  NonNullable<ResourceDirectory['header']>['customMenu']
>[number];

/**
 * Header and footer menu links are shared by every locale; a name left blank
 * in this locale shows the English one. Items without any name are dropped.
 * See docs/custom-menu.md.
 */
export function withMenuNameFallback(
  items: CustomMenuItem[] | null | undefined,
  englishItems: CustomMenuItem[] | null | undefined,
): AppConfig['header']['customMenu'] {
  return (items ?? []).flatMap((item) => {
    const englishItem = item.id
      ? englishItems?.find((english) => english.id === item.id)
      : undefined;
    const name = item.name?.trim() || englishItem?.name?.trim();
    return name ? [{ ...item, name }] : [];
  });
}
