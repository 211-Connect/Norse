/**
 * Pricing and limits for metered machine translation (printable directory
 * auto-translation). See docs/translation-usage.md.
 *
 * Google Cloud Translation bills per source character, once per target
 * language, so usage is tracked in billed characters and converted to an
 * estimated list-price cost here.
 */

export type TranslationUsageLimits = {
  /** USD per 1,000,000 billed characters. */
  pricePerMillionCharacters: number;
  /** Tenant monthly cost that emails super-admins and support, once. */
  alertThresholdUsd: number;
  /** Per-user monthly cost after which their auto-translation is skipped. */
  userQuotaUsd: number;
  /** Tenant monthly cost after which all auto-translation is skipped. */
  tenantCapUsd: number;
};

/** Per-tenant overrides, as stored in the Printable Directories tab. */
export type TranslationUsageLimitOverrides = {
  alertThresholdUsd?: number | null;
  userQuotaUsd?: number | null;
  tenantCapUsd?: number | null;
};

/**
 * Defaults for tenants without overrides. The price is Google Cloud
 * Translation's list price (USD 20 per million characters).
 */
export const DEFAULT_TRANSLATION_USAGE_LIMITS: TranslationUsageLimits = {
  pricePerMillionCharacters: 20,
  alertThresholdUsd: 10,
  userQuotaUsd: 10,
  tenantCapUsd: 25,
};

export function resolveTranslationUsageLimits(
  overrides: TranslationUsageLimitOverrides | null | undefined,
): TranslationUsageLimits {
  const defaults = DEFAULT_TRANSLATION_USAGE_LIMITS;
  const pick = (value: number | null | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : fallback;

  return {
    pricePerMillionCharacters: defaults.pricePerMillionCharacters,
    alertThresholdUsd: pick(
      overrides?.alertThresholdUsd,
      defaults.alertThresholdUsd,
    ),
    userQuotaUsd: pick(overrides?.userQuotaUsd, defaults.userQuotaUsd),
    tenantCapUsd: pick(overrides?.tenantCapUsd, defaults.tenantCapUsd),
  };
}

export function charactersToUsd(
  characters: number,
  pricePerMillionCharacters: number,
): number {
  return (characters / 1_000_000) * pricePerMillionCharacters;
}

export function usdToCharacters(
  usd: number,
  pricePerMillionCharacters: number,
): number {
  return Math.floor((usd / pricePerMillionCharacters) * 1_000_000);
}

/** Characters as Google counts them: Unicode code points. */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/** The billing month, `YYYY-MM` in UTC. */
export function getUsageMonth(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
