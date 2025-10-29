import { TenantMedia, User } from '@/payload/payload-types';

export type AdminUserData = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'sessions'
>;

export type ImageUploadData = {
  url: string;
  mime: string;
  name: string;
};

export type StrapiAttributes = {
  name: string;
  tenantId: string;
  trustedDomains: Array<{ url: string }>;
  keycloakRealmId: string;
  app_config: { data: StrapiAppConfig };
  category: { data: StrapiCategory };
  suggestion: { data: StrapiSuggestion };
  dataProviders: Array<StrapiDataProvider>;
};

export type StrapiTenant = {
  attributes: StrapiAttributes;
};

export type StrapiAppConfig = {
  id: number;
  attributes: {
    locale: string;
    localizations: {
      data: Array<{ id: number; attributes: { locale: string } }>;
    };
    logo: { data: { attributes: ImageUploadData } };
    favicon: { data: { attributes: ImageUploadData } };
    hero: { data: { attributes: ImageUploadData } };
    openGraph: { data: { attributes: ImageUploadData } };
    nextConfig?: {
      i18n: { locales: string[]; defaultLocale: string };
    };
  };
};

export type StrapiDataProvider = {
  url?: string;
  name?: string;
  logo?: { data: { attributes: ImageUploadData } };
};

export type StrapiCategory = {
  attributes: {
    locale: CategoryData['locale'];
    localizations: { data: Array<{ attributes: CategoryData }> };
    list: CategoryData['list'];
  };
};

export type StrapiSubCategoryData = {
  href: string;
  id: string;
  name: string;
  query: string;
  queryType: string;
  target: null;
};

export type CategoryData = {
  locale: string;
  list: Array<{
    id: string;
    name: string;
    image: { data: { attributes: ImageUploadData } };
    href: string;
    subcategories: Array<StrapiSubCategoryData>;
  }>;
  target: string;
};

export type StrapiSuggestion = {
  attributes: {
    locale: string;
    localizations: { data: Array<{ attributes: SuggestionData }> };
    list: Array<{
      displayName: string;
      taxonomies: string;
    }>;
  };
};

export type SuggestionData = {
  locale: string;
  list: Array<{
    displayName: string;
    taxonomies: string;
  }>;
};

export type BrandAssets = {
  logo: TenantMedia;
  favicon: TenantMedia;
  hero: TenantMedia;
  openGraph: TenantMedia;
};

export type newLayoutAssets = {
  hero?: TenantMedia;
  logo?: TenantMedia;
};
