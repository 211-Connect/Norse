import {
  CreatePrintableDirectorySectionDto,
  PrintableDirectoryCoverDto,
  PrintableDirectoryHeaderFooterDto,
  PrintableDirectoryLocalizedValuesDto,
} from '@/lib/api/generated/data-contracts';

export type CoverDialogValues = Required<
  Pick<
    PrintableDirectoryCoverDto,
    | 'titleLocalized'
    | 'descriptionLocalized'
    | 'coverImageUrlBack'
    | 'coverImageUrlFront'
  >
>;

export type HeaderFooterDialogValues = PrintableDirectoryHeaderFooterDto;

export type SectionDialogValues = Pick<
  CreatePrintableDirectorySectionDto,
  'headingLocalized' | 'descriptionLocalized' | 'maxResources'
>;

export const EMPTY_LOCALIZED_VALUES: PrintableDirectoryLocalizedValuesDto = {
  values: {},
  autoTranslatedLocales: [],
};
