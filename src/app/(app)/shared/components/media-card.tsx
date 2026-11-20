import { ReactNode } from 'react';

import { Image } from './image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

type MediaCardProps = {
  title?: string;
  image?: string;
  imageAlt?: string;
  description?: string;
  footer?: ReactNode;
};

export function MediaCard({
  title,
  image,
  imageAlt = '',
  description,
  footer,
}: MediaCardProps) {
  return (
    <Card className="group flex h-full flex-col gap-2 transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:gap-4">
      {image && (
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-lg">
          <Image
            src={image}
            alt={imageAlt}
            fill
            style={{ objectFit: 'contain' }}
            className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        </div>
      )}

      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      {description && (
        <CardContent className="grow">
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      )}

      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
