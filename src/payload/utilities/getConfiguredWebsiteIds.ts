export type TenantAnalytics = {
  umamiWebsiteId?: string | null;
  additionalWebsiteIds?: { websiteId?: string | null }[] | null;
};

export function getConfiguredWebsiteIds(
  analytics: TenantAnalytics | null | undefined,
): string[] {
  const main = analytics?.umamiWebsiteId?.trim();
  const additional = Array.isArray(analytics?.additionalWebsiteIds)
    ? analytics.additionalWebsiteIds
        .map((row) => row?.websiteId?.trim())
        .filter((id): id is string => Boolean(id))
    : [];

  const all = [...(main ? [main] : []), ...additional];
  return Array.from(new Set(all));
}
