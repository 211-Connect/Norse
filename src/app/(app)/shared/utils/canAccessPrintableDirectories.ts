import {
  AppConfig,
  PrintableDirectoryCapability,
  PrintableDirectoryViewerAccess,
} from '@/types/appConfig';

type AccessConfig = Pick<AppConfig, 'featureFlags' | 'printableDirectories'>;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeDomain = (domain: string) =>
  domain.trim().toLowerCase().replace(/^@/, '');

const getEmailDomain = (normalizedEmail: string) =>
  normalizedEmail.split('@')[1] ?? '';

const matchesEmailOrDomain = (
  normalizedEmail: string,
  emails: string[],
  domains: string[],
) => {
  const domain = getEmailDomain(normalizedEmail);

  return (
    emails.some((email) => normalizeEmail(email) === normalizedEmail) ||
    (Boolean(domain) &&
      domains.some((candidate) => normalizeDomain(candidate) === domain))
  );
};

/**
 * Basic access: feature flag on, a signed-in user, and either the tenant's
 * `everyone` access mode or a match on the allow-list.
 */
export function canAccessPrintableDirectories(
  userEmail: string | null | undefined,
  appConfig: AccessConfig,
): boolean {
  if (!appConfig.featureFlags.enablePrintableDirectories || !userEmail) {
    return false;
  }

  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail) {
    return false;
  }

  if (appConfig.printableDirectories.accessMode === 'everyone') {
    return true;
  }

  return matchesEmailOrDomain(
    normalizedEmail,
    appConfig.printableDirectories.allowedEmails,
    appConfig.printableDirectories.allowedDomains,
  );
}

/**
 * Premium capabilities: the union of every user group the user matches by
 * email or domain. Capabilities only add to basic access, so a user without
 * basic access has none.
 */
export function getUserPrintableDirectoryCapabilities(
  userEmail: string | null | undefined,
  appConfig: AccessConfig,
): Set<PrintableDirectoryCapability> {
  const capabilities = new Set<PrintableDirectoryCapability>();

  if (!canAccessPrintableDirectories(userEmail, appConfig)) {
    return capabilities;
  }

  const normalizedEmail = normalizeEmail(userEmail as string);

  for (const group of appConfig.printableDirectories.userGroups) {
    if (matchesEmailOrDomain(normalizedEmail, group.emails, group.domains)) {
      group.capabilities.forEach((capability) => capabilities.add(capability));
    }
  }

  return capabilities;
}

export function getPrintableDirectoryViewerAccess(
  userEmail: string | null | undefined,
  appConfig: AccessConfig,
): PrintableDirectoryViewerAccess {
  return {
    canAccess: canAccessPrintableDirectories(userEmail, appConfig),
    capabilities: [
      ...getUserPrintableDirectoryCapabilities(userEmail, appConfig),
    ],
  };
}
