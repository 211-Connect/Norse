'use server';

import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

import { getPrintableDirectoryById } from './getPrintableDirectoryById';

const log = createLogger('uploadPrintableDirectoryCoverImage');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches Payload's global upload limit

export type UploadPrintableDirectoryCoverImageResult = {
  url: string;
};

export async function uploadPrintableDirectoryCoverImage(
  formData: FormData,
): Promise<UploadPrintableDirectoryCoverImageResult | null> {
  const file = formData.get('file');
  const directoryId = formData.get('directoryId');
  const tenantId = formData.get('tenantId');

  if (!(file instanceof File)) {
    log.warn('No file provided for printable directory cover image upload');
    return null;
  }

  if (typeof directoryId !== 'string' || !directoryId) {
    log.warn(
      'No directoryId provided for printable directory cover image upload',
    );
    return null;
  }

  if (typeof tenantId !== 'string' || !tenantId) {
    log.warn('No tenantId provided for printable directory cover image upload');
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

  // Reuse the external API's own access control as the authorization boundary:
  // if the current session cannot read this directory, it cannot upload a cover
  // image for it either.
  const directory = await getPrintableDirectoryById(directoryId, tenantId);

  if (!directory) {
    log.warn(
      `Denied cover image upload: no access to directory ${directoryId} for tenant ${tenantId}`,
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
    log.error(
      { err: error },
      'Failed to upload printable directory cover image',
    );
    return null;
  }
}
