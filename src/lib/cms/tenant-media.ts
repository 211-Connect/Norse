import { createTenantMedia } from '@/payload/services/tenantMedia';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** An image upload can be up to 10 MB; give it time. */
const UPLOAD_TIMEOUT_MS = 60_000;

/** Stores `file` in the tenant's media; resolves to its URL or `null`. */
export async function uploadTenantMedia(
  tenantId: string,
  file: File,
): Promise<string | null> {
  if (!isCmsRemote()) {
    return createTenantMedia(tenantId, {
      data: Buffer.from(await file.arrayBuffer()),
      mimetype: file.type,
      name: file.name,
    });
  }

  const form = new FormData();
  form.set('tenantId', tenantId);
  form.set('file', file);

  const { url } = await cmsRequest<{ url: string | null }>('tenant-media', {
    method: 'POST',
    body: form,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
  return url;
}
