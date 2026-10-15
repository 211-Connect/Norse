'use server';

import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';
import { PrintableDirectoryCapability } from '@/types/appConfig';

import { getPrintableDirectoryById } from './getPrintableDirectoryById';

const log = createLogger('uploadPrintableDirectoryImage');

/** Where an uploaded image is used, and the capability that allows it. */
const IMAGE_KIND_CAPABILITIES = {
  cover: 'coverCustomization',
  logo: 'logoUpload',
} as const satisfies Record<string, PrintableDirectoryCapability>;

export type PrintableDirectoryImageKind = keyof typeof IMAGE_KIND_CAPABILITIES;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches Payload's global upload limit

export type UploadPrintableDirectoryImageResult = {
  url: string;
};

/**
 * Uploads a printable directory image (a cover image or the logo) to
 * the tenant's media and returns its URL; the caller then saves the URL on
 * the directory. Expects `file`, `kind`, `directoryId` and `tenantId`.
 */
export async function uploadPrintableDirectoryImage(
  formData: FormData,
): Promise<UploadPrintableDirectoryImageResult | null> {
  const file = formData.get('file');
  const kind = formData.get('kind');
  const directoryId = formData.get('directoryId');
  const tenantId = formData.get('tenantId');

  if (!(file instanceof File)) {
    log.warn('No file provided for printable directory image upload');
    return null;
  }

  if (typeof kind !== 'string' || !(kind in IMAGE_KIND_CAPABILITIES)) {
    log.warn(`Invalid printable directory image kind: ${String(kind)}`);
    return null;
  }

  if (typeof directoryId !== 'string' || !directoryId) {
    log.warn('No directoryId provided for printable directory image upload');
    return null;
  }

  if (typeof tenantId !== 'string' || !tenantId) {
    log.warn('No tenantId provided for printable directory image upload');
    return null;
  }

  if (!file.type.startsWith('image/')) {
    log.warn(`Rejected non-image file upload: ${file.type}`);
    return null;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    log.warn(`Rejected oversized file upload: ${file.size} bytes`);
    return null;
  }

  // Each kind of image is a premium capability (see
  // docs/printable-directories.md).
  const capability =
    IMAGE_KIND_CAPABILITIES[kind as PrintableDirectoryImageKind];
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access?.hasCapability(capability)) {
    log.warn(
      `Denied ${kind} image upload: user lacks the ${capability} capability for tenant ${tenantId}`,
    );
    return null;
  }

  // Also confirm the current session can read this specific directory.
  const directory = await getPrintableDirectoryById(directoryId, tenantId);

  if (!directory) {
    log.warn(
      `Denied image upload: no access to directory ${directoryId} for tenant ${tenantId}`,
    );
    return null;
  }

  try {
    const payload = await getPayloadSingleton();
    const buffer = Buffer.from(await file.arrayBuffer());

    const media = await payload.create({
      collection: 'tenant-media',
      data: {
        tenant: tenantId,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: buffer.length,
      },
    });

    if (!media.url) {
      log.error('Uploaded tenant-media document is missing a url');
      return null;
    }

    return { url: media.url };
  } catch (error) {
    log.error({ err: error }, 'Failed to upload printable directory image');
    return null;
  }
}
