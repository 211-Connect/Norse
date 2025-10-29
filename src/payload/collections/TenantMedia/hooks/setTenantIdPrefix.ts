import type { CollectionBeforeOperationHook } from "payload";
import { extractID } from "payload/shared";

export const setTenantIdPrefix: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  // TODO: Double-check updates
  if (operation !== "create" || !req.file) {
    return args;
  }

  const tenant = args?.data?.tenant;
  if (!tenant) {
    throw new Error("Tenant is required to manipulate tenant-media collection");
  }

  args.data.prefix = extractID(tenant);

  return args;
};
