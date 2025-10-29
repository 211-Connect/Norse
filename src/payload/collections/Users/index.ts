import type { CollectionConfig } from "payload";

import { createAccess } from "./access/create";
import { readAccess } from "./access/read";
import { updateAndDeleteAccess } from "./access/updateAndDelete";
import { isSuperAdmin } from "./access/isSuperAdmin";
import { tenantsArrayField } from "@payloadcms/plugin-multi-tenant/fields";
import { setCookieBasedOnDomain } from "./hooks/setCookieBasedOnDomain";

const defaultTenantArrayField = tenantsArrayField({
  tenantsArrayFieldName: "tenants",
  tenantsArrayTenantFieldName: "tenant",
  tenantsCollectionSlug: "tenants",
  arrayFieldAccess: {},
  tenantFieldAccess: {},
  rowFields: [
    {
      name: "roles",
      type: "select",
      defaultValue: ["tenant-viewer"],
      hasMany: true,
      options: ["tenant-admin", "tenant-viewer"],
      required: true,
    },
  ],
});

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    create: createAccess,
    delete: updateAndDeleteAccess,
    read: readAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  fields: [
    {
      admin: {
        position: "sidebar",
      },
      name: "roles",
      type: "select",
      defaultValue: ["user"],
      hasMany: true,
      options: ["super-admin", "user"],
      access: {
        update: ({ req }) => {
          return isSuperAdmin(req.user);
        },
      },
    },
    {
      ...defaultTenantArrayField,
      admin: {
        ...(defaultTenantArrayField?.admin || {}),
        position: "sidebar",
      },
    },
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
};
