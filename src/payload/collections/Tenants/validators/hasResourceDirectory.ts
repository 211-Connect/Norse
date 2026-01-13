import { CheckboxFieldValidation } from 'payload';
import { findResourceDirectoryByTenantId } from '../../ResourceDirectories/actions';

export const hasResourceDirectory: CheckboxFieldValidation = async (
  value,
  { id },
) => {
  if (value) {
    const resourceDirectory = await findResourceDirectoryByTenantId(String(id));
    if (!resourceDirectory) {
      return 'A Resource Directory must be created before this service can be enabled.';
    }
  }

  return true;
};
