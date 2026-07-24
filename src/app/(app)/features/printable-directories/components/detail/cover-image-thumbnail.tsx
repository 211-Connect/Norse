import { cn } from '@/app/(app)/shared/lib/utils';

type CoverImageThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
};

// Matches the US Letter portrait aspect ratio (8.5 x 11 in) used for the
// generated PDF cover pages, so previews accurately reflect the final output.
export function CoverImageThumbnail({
  src,
  alt,
  className,
}: CoverImageThumbnailProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('h-22 w-17 rounded border object-cover', className)}
    />
  );
}
