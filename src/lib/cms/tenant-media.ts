import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** An image upload can be up to 10 MB; give it time. */
const UPLOAD_TIMEOUT_MS = 60_000;

/** Stores `file` in the tenant's media; resolves to its URL or `null`. */
export async function uploadTenantMedia(
  tenantId: string,
  file: File,
): Promise<string | null> {
  // Dropped from the public app's build (see ./tenants.ts).
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { createTenantMedia } =
        await import('@/payload/services/tenantMedia');
      return createTenantMedia(tenantId, {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
      });
    }
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
