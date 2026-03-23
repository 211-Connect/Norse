'use client';

import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { ResultType } from '@/app/(app)/shared/store/results';
import { SearchCardComponentId } from '../types/card-component-ids';
import {
  getSearchCardComponentById,
  shouldSearchCardComponentRender,
} from './card-component-registry';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { cleanSeparators } from '@/app/(app)/shared/utils/layout-utils';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

interface CardLayoutRendererProps {
  layout: SearchCardLayoutConfig;
  result: ResultType;
}

export function CardLayoutRenderer({
  layout,
  result,
}: CardLayoutRendererProps) {
  const appConfig = useAppConfig();

  if (!layout || layout.length === 0) {
    return null;
  }

  const itemsToRender = layout.filter((item) =>
    shouldSearchCardComponentRender(item.componentId, result, appConfig),
  );

  const allRenderedComponents = itemsToRender.map((item, itemIndex) => {
    const Component = getSearchCardComponentById(item.componentId);
    if (!Component) {
      console.warn(`Component not found for ID: ${item.componentId}`);
      return null;
    }

    const isSeparator = item.componentId === SearchCardComponentId.SEPARATOR;
    return {
      element: (
        <Component
          key={isSeparator ? `separator-${itemIndex}` : item.componentId}
          result={result}
          customAttribute={item.customAttribute}
        />
      ),
      isSeparator,
    };
  });

  const withoutNulls = allRenderedComponents.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );

  const cleanedComponents = cleanSeparators(withoutNulls);

  const renderedComponents = cleanedComponents.map((item) => item.element);

  if (renderedComponents.length === 0) {
    return null;
  }

  return (
    <>
      <Card id={result._id} className="flex flex-col print:border-none">
        <CardContent className="flex flex-col gap-2">
          {renderedComponents}
        </CardContent>
      </Card>

      <Separator className="hidden border-b border-black bg-none print:block" />
    </>
  );
}
