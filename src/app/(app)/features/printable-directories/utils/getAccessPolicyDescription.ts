import { AccessPolicy } from '@/types/printableDirectories';
import { TFunction } from 'i18next';

const ACCESS_POLICY_DESCRIPTIONS: Record<AccessPolicy, string> = {
  private: 'access_policy_description.private',
  'shared-read': 'access_policy_description.shared_read',
  'shared-edit': 'access_policy_description.shared_edit',
};

export const getAccessPolicyDescription = (
  accessPolicy: AccessPolicy,
  t: TFunction,
) => {
  return t(ACCESS_POLICY_DESCRIPTIONS[accessPolicy], {
    ns: 'page-directories',
  });
};
