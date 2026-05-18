export type BrandingConfigTheme = {
  /** Whether the newLayout chrome (gradient header, alternate logo) is active for this tenant. */
  newLayoutEnabled: boolean;
  primaryColor: string;
  secondaryColor: string;
  borderRadius: string;
  headerGradient: {
    start: string;
    end: string;
  };
};

export type BrandingConfigResolvedFrom = {
  source: 'payload';
  resourceDirectoryId: string;
};

export type BrandingConfig = {
  tenantId: string;
  locale: string;
  revision: string;
  resolvedFrom: BrandingConfigResolvedFrom;
  brand: {
    name: string;
    /** Primary brand logo (brand tab). */
    logoUrl?: string;
    /** Brand tab hero image. */
    heroUrl?: string;
    /** Alternate logo shown when newLayout is enabled (newLayout tab). */
    newLayoutLogoUrl?: string;
    /** New layout hero image. */
    newLayoutHeroUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
    copyright?: string;
  };
  theme: BrandingConfigTheme;
  metadata: {
    title?: string;
    description?: string;
  };
  contact: {
    phoneNumber?: string;
    feedbackUrl?: string;
  };
};
