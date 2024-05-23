import { openContextModal } from '@mantine/modals';
import { FavoriteList } from './molecules/favorite-list';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

type Props = {
  favoriteLists: any[];
};

export function FavoriteListSection(props: Props) {
  const { t } = useTranslation('page-favorites');

  return (
    <>
      <div className="flex">
        <Button
          onClick={() => {
            openContextModal({
              modal: 'create-list',
              title: t('modal.create_list.create_a_list', { ns: 'common' }),
              centered: true,
              innerProps: {
                t: t,
              },
            });
          }}
        >
          {t('modal.create_list.create_a_list', { ns: 'common' })}
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <p id="result-total">
          {props.favoriteLists.length} {t('lists')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {props.favoriteLists.map((el: any) => (
          <FavoriteList
            key={el._id}
            id={el._id}
            name={el.name}
            description={el.description}
            privacy={el.privacy}
          />
        ))}

        {props.favoriteLists.length === 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-center">
                <Image
                  src="/undraw_no_data.svg"
                  width={0}
                  height={150}
                  alt=""
                  style={{ height: '150px', width: 'auto' }}
                />
              </div>

              <h3>{t('no_lists')}</h3>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
