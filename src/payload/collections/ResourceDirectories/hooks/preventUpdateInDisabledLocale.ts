import { locales } from '@/payload/i18n/locales';
import {
  APIError,
  TypedLocale,
  type CollectionBeforeChangeHook,
} from 'payload';
import { extractID } from 'payload/shared';

export const preventUpdateInDisabledLocale: CollectionBeforeChangeHook =
  async ({ data, req: { payload, locale }, operation, originalDoc }) => {
    if (operation !== 'update') {
      return data;
    }

    if (!locale) {
      throw new APIError(
        'Cannot update Resource Directory without locale.',
        400,
      );
    }

    const tenantId = extractID(originalDoc.tenant);
    if (!tenantId) {
      throw new APIError(
        'Cannot update Resource Directory without tenant ID.',
        400,
      );
    }

    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      depth: 0,
    });
    if (!tenant) {
      throw new APIError(`Tenant with ID '${tenantId}' not found.`, 404);
    }

    if (locale === 'all') {
      const allLocalesEnabled = locales.every((loc) =>
        tenant.enabledLocales.includes(loc as TypedLocale),
      );
      if (!allLocalesEnabled) {
        throw new APIError(
          `This resource directory cannot be updated for all locales because not all system locales are enabled for this tenant.`,
          400,
        );
      }
    } else if (!tenant.enabledLocales.includes(locale)) {
      throw new APIError(
        `This resource directory cannot be updated in the '${locale}' locale because it is not enabled for this tenant.`,
        400,
      );
    }

    return data;
  };
