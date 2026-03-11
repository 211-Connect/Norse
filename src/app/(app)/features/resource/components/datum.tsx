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
  icon?: LucideIcon | null;
  iconColor?: string | null;
  url?: string | null;
  urlTarget?: '_blank' | '_self' | null;
  titleBelow?: boolean | null;
  size?: 'sm' | 'md' | null;
  shouldParseHtml?: boolean;
}

export function Datum({
  id,
  title,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  url,
  urlTarget = '_self',
  titleBelow,
  size = 'sm',
  shouldParseHtml = true,
}: DatumProps) {
  const generatedId = id ?? title?.replace(/\s+/g, '-').toLowerCase();
  const parsedDescription =
    description && shouldParseHtml ? parseHtml(description) : description;

  return (
    <div
      className="flex flex-row gap-2 whitespace-pre-line py-2"
      id={generatedId}
    >
      <div>
        {Icon ? (
          <Icon
            className={cn('my-1 size-4', iconColor)}
            style={
              iconColor?.startsWith('#') ? { color: iconColor } : undefined
            }
          />
        ) : null}
      </div>
      {titleBelow ? (
        <div className="flex flex-col">
          <Typography
            variant="paragraph"
            size={size}
            url={url}
            urlTarget={urlTarget}
          >
            {parsedDescription}
          </Typography>
          <div className="flex flex-row">
            <Typography variant="label" size="sm">
              {title}
            </Typography>
            <Typography variant="paragraph" size="sm">
              {subtitle}
            </Typography>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <Typography variant="label" size={size}>
            {title}
          </Typography>
          <Typography
            variant="paragraph"
            size={size}
            url={url}
            urlTarget={urlTarget}
          >
            {parsedDescription}
          </Typography>
        </div>
      )}
    </div>
  );
}
