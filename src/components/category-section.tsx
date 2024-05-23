import { Category } from './molecules/category';
import { useTranslation } from 'next-i18next';
import categories from '../../.norse/categories.json';

export function CategorySection() {
  const { t } = useTranslation('page-home');

  if ((categories?.length ?? 0) === 0) return null;

  return (
    <div className="categories pt-4 pb-4 container gap-4 flex flex-col">
      <h5 className="text-2xl font-bold">{t('categories_title')}</h5>

      <div className="grid grid-cols-4 gap-4">
        {categories.map((el: any, idx) => (
          <div key={el.name}>
            <Category index={idx} {...el} />
          </div>
        ))}
      </div>
    </div>
  );
}
