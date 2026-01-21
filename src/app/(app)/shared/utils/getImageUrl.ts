export const getImageUrl = (filenameWithExtension: string) =>
  `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/images/${filenameWithExtension}`;
