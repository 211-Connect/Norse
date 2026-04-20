'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';

export interface DatumProps {
  id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  subdescription?: string | null;
  icon?: LucideIcon | null;
  iconColor?: string | null;
  url?: string | null;
  urlTarget?: '_blank' | '_self' | null;
  urlAriaLabel?: string | null;
  titleBelow?: boolean | null;
  singleLine?: boolean;
  size?: 'sm' | 'md' | null;
  shouldParseHtml?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export function Datum({
  id,
  title,
  subtitle,
  description,
  subdescription,
  icon: Icon,
  iconColor,
  url,
  urlTarget = '_self',
  urlAriaLabel,
  titleBelow,
  singleLine = false,
  size = 'sm',
  shouldParseHtml = true,
  className,
  onClick,
}: DatumProps) {
  const generatedId = id ?? title?.replace(/\s+/g, '-').toLowerCase();
  const parsedDescription =
    description && shouldParseHtml ? parseHtml(description) : description;
  const descriptionAs =
    shouldParseHtml && description !== parsedDescription ? 'div' : undefined;
  const parsedSubdescription =
    subdescription && shouldParseHtml
      ? parseHtml(subdescription)
      : subdescription;
  const subdescriptionAs =
    shouldParseHtml && subdescription !== parsedSubdescription
      ? 'div'
      : undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-row py-2',
        {
          'gap-2': Boolean(Icon),
          truncate: singleLine,
          'items-center': singleLine,
        },
        className,
      )}
      id={generatedId}
    >
      <div className="flex-shrink-0">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn('my-1 size-4', iconColor)}
            style={
              iconColor?.startsWith('#') ? { color: iconColor } : undefined
            }
          />
        ) : null}
      </div>
      {titleBelow ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography
            variant="paragraph"
            size={size}
            url={url}
            urlTarget={urlTarget}
            as={descriptionAs}
            aria-label={urlAriaLabel ?? undefined}
            className="whitespace-pre-line"
          >
            {parsedDescription}
          </Typography>
          {parsedSubdescription && (
            <Typography
              variant="paragraph"
              size="xs"
              as={subdescriptionAs}
              className="whitespace-pre-line"
            >
              {parsedSubdescription}
            </Typography>
          )}
          <div className="flex flex-row items-center">
            <Typography variant="label" size="sm">
              {title}
            </Typography>
            {title && subtitle && <span className="mx-1">·</span>}
            <Typography variant="paragraph" size="sm">
              {subtitle}
            </Typography>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography variant="label" size={size}>
            {title}
          </Typography>
          <Typography
            variant="paragraph"
            size={size}
            url={url}
            urlTarget={urlTarget}
            as={descriptionAs}
            aria-label={urlAriaLabel ?? undefined}
            className="whitespace-pre-line"
          >
            {parsedDescription}
          </Typography>
          {parsedSubdescription && (
            <Typography
              variant="paragraph"
              size="xs"
              as={subdescriptionAs}
              className="whitespace-pre-line"
            >
              {parsedSubdescription}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}
