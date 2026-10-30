import { internalRoute } from '@/lib/cms/internal-route';
import { createTenantMedia } from '@/payload/services/tenantMedia';

/**
 * POST multipart { tenantId, file } → `{ url }` of the stored tenant media.
 * The public app checks the user's access, file type and size first
 * (`uploadPrintableDirectoryImage`).
 */
export const POST = internalRoute(async (request) => {
  const form = await request.formData().catch(() => null);
  const tenantId = form?.get('tenantId');
  const file = form?.get('file');

  if (typeof tenantId !== 'string' || !tenantId || !(file instanceof File)) {
    return Response.json(
      { error: 'tenantId and file are required' },
      { status: 400 },
    );
  }

  const url = await createTenantMedia(tenantId, {
    data: Buffer.from(await file.arrayBuffer()),
    mimetype: file.type,
    name: file.name,
  });
  return { url };
});
