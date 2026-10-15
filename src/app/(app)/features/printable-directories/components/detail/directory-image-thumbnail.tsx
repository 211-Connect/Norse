import { cn } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryImageKind } from '@/app/(app)/shared/serverActions/printableDirectories/uploadPrintableDirectoryImage';

type DirectoryImageThumbnailProps = {
  src: string;
  alt: string;
  kind: PrintableDirectoryImageKind;
  className?: string;
};

// Shapes match the PDF: covers are US Letter portrait pages (8.5 x 11 in);
// the logo is fitted into a 100 x 40 header slot.
const KIND_CLASSNAMES: Record<PrintableDirectoryImageKind, string> = {
  cover: 'h-22 w-17 object-cover',
  logo: 'h-10 w-25 bg-white object-contain p-0.5',
};

export function DirectoryImageThumbnail({
  src,
  alt,
  kind,
  className,
}: DirectoryImageThumbnailProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('rounded border', KIND_CLASSNAMES[kind], className)}
    />
  );
}
