import { Fragment, PropsWithChildren } from 'react';
import { useTranslation } from 'next-i18next';
import { Anchor } from '@/components/anchor';
import { useAppConfig } from '@/hooks/use-app-config';
import { IconPointFilled } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Icon from '../icon';

type Props = PropsWithChildren & {
  fullWidth?: boolean;
};

export function AppFooter(props: Props) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const customFooterItems: any[] = t('footer', {
    ns: 'menus',
    returnObjects: true,
  });

  return (
    <div className="bg-white">
      <hr />

      {props.children}

      <footer>
        <div
          className={cn(
            props.fullWidth ? 'w-full' : 'container mx-auto',
            'h-[80px] flex items-center justify-between pl-4 pr-4 2xl:pl-0 2xl:pr-0',
          )}
        >
          <div className="flex flex-col justify-center items-center gap-1 w-full">
            <p>
              &copy; {new Date().getFullYear()} {appConfig?.brand?.name}.{' '}
              {t('footer.copyright')}
            </p>

            <div className="flex gap-2">
              <Anchor href="/legal/privacy-policy">
                {t('footer.privacy_policy')}
              </Anchor>

              {customFooterItems.map((el) => (
                <Fragment key={el.name}>
                  <IconPointFilled className="scale-4" />
                  <Anchor className="flex gap-1 items-center" href={el.href}>
                    {el.icon && <Icon name={el.icon} className="size-4" />}
                    {el.name}
                  </Anchor>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
