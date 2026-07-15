'use client';

import { StaggeredShimmers } from '@payloadcms/ui';

type WidgetSkeletonProps = {
  bordered?: boolean;
  height?: string | number;
  count?: number;
  shimmerHeight?: number;
};

export function WidgetSkeleton({
  height,
  count = 1,
  shimmerHeight = 48,
}: WidgetSkeletonProps) {
  return (
    <div style={{ height }}>
      <StaggeredShimmers count={count} height={shimmerHeight} />
    </div>
  );
}
