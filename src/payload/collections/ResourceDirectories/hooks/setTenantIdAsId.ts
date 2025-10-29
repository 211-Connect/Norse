import { CollectionBeforeChangeHook } from "payload";

export const setTenantIdAsId: CollectionBeforeChangeHook = ({
  data,
  operation,
}) => {
  if (operation === "create" && data.tenant) {
    data.id = typeof data.tenant === "string" ? data.tenant : data.tenant.id;
  }

  return data;
};
