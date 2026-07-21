'use client';

import {
  Alert as AlertContainer,
  AlertDescription,
} from '@/app/(app)/shared/components/ui/alert';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';
import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';
import { AlertCircle } from 'lucide-react';

export function AlertComponent({
  resource,
}: {
  resource: Resource | ResultType;
}) {
  if (!resource.alert) {
    return null;
  }

  return (
    <AlertContainer className="py-2" variant="destructive">
      <AlertDescription className="flex flex-row items-center gap-2">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        <Typography variant="label" size="sm" className="text-destructive">
          {parseHtml(resource.alert)}
        </Typography>
      </AlertDescription>
    </AlertContainer>
  );
}
