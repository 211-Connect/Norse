import { IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';
import { NavLink } from '@/components/nav-link';
import { Anchor } from '@/components/anchor';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

type Props = {
  index: string;
  name: string;
  image?: string;
  href?: string;
  subcategories: any[];
};

export function Category({ index, image, href, subcategories }: Props) {
  const { t } = useTranslation('dynamic');

  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex justify-start items-start gap-2">
        {image && (
          <Image
            src={image}
            alt=""
            width={80}
            height={0}
            style={{
              height: 'auto',
              width: '40px',
            }}
          />
        )}

        <div className="flex flex-col">
          <h6 className="font-semibold text-lg pl-2">
            {t(`categories.${index}`)}
          </h6>
          {subcategories.map((el, key) => (
            <div key={el.name}>
              <NavLink
                key={el.name}
                href={`${
                  el.href
                    ? el.href
                    : `/search?query=${encodeURIComponent(
                        el.query
                      )}&query_label=${encodeURIComponent(
                        t(`categories.${index}.subcategories.${key}`)
                      )}&query_type=${encodeURIComponent(el.query_type)}`
                }`}
                prefetch={false}
                target={el.href ? '_blank' : '_self'}
                rel={el.href ? 'noopener noreferrer' : ''}
              >
                {el.href ? <IconExternalLink className="size-4" /> : null}
                {t(`categories.${index}.subcategories.${key}`)}
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Anchor
      href={href || '/'}
      className="rounded-md shadow-md transition-all block focus:outline-2 focus:outline focus:outline-offset-4 hover:scale-105 focus:scale-105"
    >
      <Card>
        <CardContent className="p-0">
          {image && (
            <div className="flex items-center justify-center pt-8 pb-8">
              <div className="rounded-full w-[75px] h-[75px] relative p-4 bg-background">
                <Image
                  src={image}
                  alt=""
                  width={0}
                  height={0}
                  style={{
                    width: '100%',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary rounded-bl-md rounded-br-md items-center justify-center pt-2 pb-2">
          <p className="text-primary-foreground text-lg">
            {t(`categories.${index}`)}
          </p>
        </CardFooter>
      </Card>
    </Anchor>
  );
}
