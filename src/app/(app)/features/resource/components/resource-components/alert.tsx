'use client';

import {
  Alert as AlertContainer,
  AlertDescription,
} from '@/app/(app)/shared/components/ui/alert';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';
import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';

export function AlertComponent({
  resource,
}: {
  resource: Resource | ResultType;
}) {
  if (!resource.alert) {
    return null;
  }

  return (
    <AlertContainer className="py-2">
      <AlertDescription>{parseHtml(resource.alert)}</AlertDescription>
    </AlertContainer>
  );
}
