import type { CollectionBeforeOperationHook } from 'payload';
import { extractID } from 'payload/shared';

export const setTenantIdPrefix: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  // TODO: Double-check updates
  if (operation !== 'create' || !req.file) {
    return args;
  }

  if (
    !(
      args.data &&
      'tenant' in args?.data &&
      typeof args.data.tenant === 'string'
    )
  ) {
    throw new Error('Tenant is required to manipulate tenant-media collection');
  }

  (args.data as Record<string, unknown>).prefix = extractID(args.data.tenant);

  return args;
};
