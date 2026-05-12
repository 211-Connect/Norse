import { withOptionalCustomBasePath } from '../lib/utils';

export const getImageUrl = (filenameWithExtension: string) =>
  withOptionalCustomBasePath(`/images/${filenameWithExtension}`);
