import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export type TenantMediaFile = {
  data: Buffer;
  mimetype: string;
  name: string;
};

/**
 * Stores `file` in the tenant's media (S3) and returns its public URL, or
 * `null` when Payload returned no URL. Runs in the CMS; the public app
 * reaches it through `@/lib/cms/tenant-media`.
 */
export async function createTenantMedia(
  tenantId: string,
  file: TenantMediaFile,
): Promise<string | null> {
  const payload = await getPayloadSingleton();
  const media = await payload.create({
    collection: 'tenant-media',
    data: { tenant: tenantId },
    file: { ...file, size: file.data.length },
  });

  return media.url ?? null;
}
