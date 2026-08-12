import { Skeleton } from '@/app/(app)/shared/components/ui/skeleton';

export default function ResourceLoading() {
  return (
    <div className="container mx-auto flex flex-col gap-2 pt-2 pb-2">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />

        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col gap-6 pt-4 md:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />

            <Skeleton className="mt-4 h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="flex w-full flex-col gap-4 md:w-80">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
