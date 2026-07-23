import { AccessPolicy } from '@/types/printableDirectories';
import { TFunction } from 'i18next';

const ACCESS_POLICY_LABELS: Record<AccessPolicy, string> = {
  private: 'access_policy_name.private',
  'shared-read': 'access_policy_name.shared_read',
  'shared-edit': 'access_policy_name.shared_edit',
};

export const getAccessPolicyLabel = (
  accessPolicy: AccessPolicy,
  t: TFunction,
) => {
  return t(ACCESS_POLICY_LABELS[accessPolicy], { ns: 'page-directories' });
};
