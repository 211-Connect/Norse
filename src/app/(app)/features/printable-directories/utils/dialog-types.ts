import {
  CreatePrintableDirectorySectionDto,
  PrintableDirectoryCoverDto,
  PrintableDirectoryHeaderFooterDto,
} from '@/lib/api/generated/data-contracts';

export type CoverDialogValues = Required<
  Pick<
    PrintableDirectoryCoverDto,
    'titleLocalized' | 'descriptionLocalized' | 'primaryColor'
  >
>;

export type HeaderFooterDialogValues = Omit<
  PrintableDirectoryHeaderFooterDto,
  'logoUrl'
>;

export type SectionDialogValues = Pick<
  CreatePrintableDirectorySectionDto,
  'headingLocalized' | 'descriptionLocalized' | 'maxResources'
>;
