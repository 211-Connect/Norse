import { ShareButton } from '@/shared/components/share-button';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Resource } from '@/types/resource';
import { RefObject } from 'react';

type NavigationProps = {
  resource: Resource;
  componentToPrintRef: RefObject<HTMLDivElement>;
  prevSearch: string | undefined;
};

export function Navigation({
  componentToPrintRef,
  resource,
  prevSearch,
}: NavigationProps) {
  const t = useTranslations('page');

  const prevHref = prevSearch ? `/search?${prevSearch}` : '/';

  return (
    <div className="flex justify-between print:hidden">
      <Link className={buttonVariants({ variant: 'outline' })} href={prevHref}>
        <ChevronLeft size={16} />
        {prevSearch ? t('back_to_results') : t('back_to_home')}
      </Link>

      <div className="flex gap-2">
        <ShareButton
          componentToPrintRef={componentToPrintRef}
          title={resource.name}
          body={resource.description}
        />
        {/* <AddToFavoritesButton serviceAtLocationId={resource.id} /> */}
      </div>
    </div>
  );
}
