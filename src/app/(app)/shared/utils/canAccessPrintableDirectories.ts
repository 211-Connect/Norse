import { AppConfig } from '@/types/appConfig';

export function canAccessPrintableDirectories(
  userEmail: string | null | undefined,
  appConfig: Pick<AppConfig, 'featureFlags' | 'printableDirectories'>,
): boolean {
  if (!appConfig.featureFlags.enablePrintableDirectories || !userEmail) {
    return false;
  }

  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const allowedEmails = new Set(
    appConfig.printableDirectories.allowedEmails
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (allowedEmails.has(normalizedEmail)) {
    return true;
  }

  const domain = normalizedEmail.split('@')[1];
  if (!domain) {
    return false;
  }

  const allowedDomains = new Set(
    appConfig.printableDirectories.allowedDomains
      .map((allowedDomain) =>
        allowedDomain.trim().toLowerCase().replace(/^@/, ''),
      )
      .filter(Boolean),
  );

  return allowedDomains.has(domain);
}
