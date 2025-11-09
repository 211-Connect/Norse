import { Access, FieldAccess } from 'payload';
import {
  isSuperAdminAccess,
  isSuperAdminFieldAccess,
  isSupportAccess,
  isSupportFieldAccess,
  isTenantAccess,
  isTenantFieldAccess,
} from './roles';
import { isTenantAdminAccess, isTenantAdminFieldAccess } from './roles-tenant';

/* PROPERTY SETTINGS */
export const hasPropertySettingsAccess: Access = ({ req }) => {
  return isSuperAdminAccess({ req });
};
export const hasPropertySettingsFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdminFieldAccess({ req });
};

/* RESOURCE NAVIGATION */
export const hasResourceNavigationAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAccess({ req })
  );
};
export const hasResourceNavigationFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantFieldAccess({ req })
  );
};

/* CONTACT */
export const hasContactAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAdminAccess({ req })
  );
};
export const hasContactFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantAdminFieldAccess({ req })
  );
};

/* THEME */
export const hasThemeAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAdminAccess({ req })
  );
};
export const hasThemeFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantAdminFieldAccess({ req })
  );
};

/* SITE  NAVIGATION */
export const hasSiteNavigationAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAdminAccess({ req })
  );
};
export const hasSiteNavigationFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantAdminFieldAccess({ req })
  );
};

/* SEARCH */
export const hasSearchAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAdminAccess({ req })
  );
};
export const hasSearchFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantAdminFieldAccess({ req })
  );
};

/* CONTENT */
export const hasContentAccess: Access = ({ req }) => {
  return (
    isSuperAdminAccess({ req }) ||
    isSupportAccess({ req }) ||
    isTenantAdminAccess({ req })
  );
};
export const hasContentFieldAccess: FieldAccess = ({ req }) => {
  return (
    isSuperAdminFieldAccess({ req }) ||
    isSupportFieldAccess({ req }) ||
    isTenantAdminFieldAccess({ req })
  );
};

/* FEATURE */
export const hasFeatureAccess: Access = ({ req }) => {
  return isSuperAdminAccess({ req }) || isSupportAccess({ req });
};
export const hasFeatureFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdminFieldAccess({ req }) || isSupportFieldAccess({ req });
};

/* LAYOUT */
export const hasLayoutAccess: Access = ({ req }) => {
  return isSuperAdminAccess({ req });
};
export const hasLayoutFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdminFieldAccess({ req });
};
