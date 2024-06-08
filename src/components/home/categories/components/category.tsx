import Image from 'next/image';
import { NavLink } from '@/components/nav-link';
import { Anchor } from '@/components/anchor';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

type Props = {
  index: string;
  name: string;
  image?: string;
  href?: string;
  subcategories: any[];
};

export function Category({ index, name, image, href, subcategories }: Props) {
  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex items-start justify-start gap-2">
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
          <h6 className="pl-2 text-lg font-semibold">{name}</h6>
          {subcategories.map((el, key) => (
            <div key={el.name}>
              <NavLink
                key={el.name}
                href={`${
                  el.href
                    ? el.href
                    : `/search?query=${encodeURIComponent(
                        el.query,
                      )}&query_label=${encodeURIComponent(
                        el.name,
                      )}&query_type=${encodeURIComponent(el.query_type)}`
                }`}
                prefetch={false}
                target={el.href ? '_blank' : '_self'}
                rel={el.href ? 'noopener noreferrer' : ''}
              >
                {el.href ? <ExternalLink className="size-4" /> : null}
                {el.name}
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
      className="block rounded-md shadow-md transition-all hover:scale-105 focus:scale-105 focus:outline focus:outline-2 focus:outline-offset-4"
    >
      <Card>
        <CardContent className="p-0">
          {image && (
            <div className="flex items-center justify-center pb-8 pt-8">
              <div className="relative h-[75px] w-[75px] rounded-full bg-background p-4">
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
        <CardFooter className="items-center justify-center rounded-bl-md rounded-br-md bg-primary pb-2 pt-2">
          <p className="text-lg text-primary-foreground">{name}</p>
        </CardFooter>
      </Card>
    </Anchor>
  );
}
