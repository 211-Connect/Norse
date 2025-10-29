import { CheckboxFieldValidation } from 'payload';

import { findByTenantId } from '../../ResourceDirectories/services/findByTenantId';

export const hasResourceDirectory: CheckboxFieldValidation = async (
  value,
  { id, req: { payload } },
) => {
  if (value) {
    const resourceDirectory = await findByTenantId(payload, id as string);
    if (!resourceDirectory) {
      return 'A Resource Directory must be created before this service can be enabled.';
    }
  }

  return true;
};
