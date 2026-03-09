'use client';

import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Resource } from '@/types/resource';
import { ResourceLayout, LayoutColumnItem } from '../types/layout-config';
import { ResourceComponentId } from '../types/component-ids';
import {
  getResourceComponentById,
  shouldComponentRender,
} from './component-registry';

interface LayoutRendererProps {
  layout: ResourceLayout;
  resource: Resource;
  className?: string;
}

type ColumnRendererProps = {
  groups: { items: LayoutColumnItem[]; isCard: boolean }[];
  resource: Resource;
};

function ColumnRenderer({ groups, resource }: ColumnRendererProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {groups.map((group, groupIndex) => {
        const itemsToRender = group.items.filter((item) =>
          shouldComponentRender(item.componentId, resource),
        );

        const allRenderedComponents = itemsToRender.map((item, itemIndex) => {
          const Component = getResourceComponentById(item.componentId);
          if (!Component) {
            console.warn(`Component not found for ID: ${item.componentId}`);
            return null;
          }

          const isSeparator =
            item.componentId === ResourceComponentId.SEPARATOR;
          return {
            element: (
              <Component
                key={
                  isSeparator
                    ? `separator-${groupIndex}-${itemIndex}`
                    : item.componentId
                }
                resource={resource}
              />
            ),
            isSeparator,
          };
        });

        const withoutNulls = allRenderedComponents.filter(
          (item): item is NonNullable<typeof item> => item !== null,
        );

        const cleanedComponents = withoutNulls.filter((item, index) => {
          if (!item.isSeparator) {
            return true;
          }

          if (index === 0) {
            return false;
          }

          if (index === withoutNulls.length - 1) {
            return false;
          }

          const nextItem = withoutNulls[index + 1];
          if (nextItem && nextItem.isSeparator) {
            return false;
          }

          return true;
        });

        const renderedComponents = cleanedComponents.map(
          (item) => item.element,
        );

        if (renderedComponents.length === 0) {
          return null;
        }

        if (group.isCard) {
          return (
            <Card
              key={`group-${groupIndex}`}
              className="print:border-none print:shadow-none"
            >
              <CardContent className="flex flex-col gap-4">
                {renderedComponents}
              </CardContent>
            </Card>
          );
        }

        return (
          <div key={`group-${groupIndex}`} className="flex flex-col gap-4">
            {renderedComponents}
          </div>
        );
      })}

      <Separator className="hidden border-b border-black print:block" />
    </div>
  );
}

export function LayoutRenderer({
  layout,
  resource,
  className,
}: LayoutRendererProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 font-sans md:grid-cols-2',
        className,
      )}
    >
      <ColumnRenderer groups={layout.leftColumn} resource={resource} />
      <ColumnRenderer groups={layout.rightColumn} resource={resource} />
    </div>
  );
}
