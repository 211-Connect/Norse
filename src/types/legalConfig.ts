export type LegalPage = {
  enabled: boolean;
  title?: string;
  content?: string;
};

export type LegalConfigResolvedFrom = {
  source: 'payload';
  resourceDirectoryId: string;
};

export type LegalConfig = {
  tenantId: string;
  locale: string;
  revision: string;
  resolvedFrom: LegalConfigResolvedFrom;
  privacyPolicy: LegalPage;
  termsOfUse: LegalPage;
};
