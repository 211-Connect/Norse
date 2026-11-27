import type { TaskConfig } from 'payload';
import { retry } from 'radash';

import {
  maskTemplateTags,
  unmaskTemplateTags,
} from '@/app/(app)/features/landing-pages/lib/templateTags';
import {
  slugify,
  topicSlugProblem,
} from '@/app/(app)/features/landing-pages/lib/slugs';
import { createLogger } from '@/lib/logger';

import { defaultLocale } from '../i18n/locales';
import { batchTranslate } from '../services/translationService';

const log = createLogger('translateLandingTopic');

export const LANDING_TOPIC_TRANSLATED_FIELDS = [
  'name',
  'copy.title',
  'copy.description',
  'copy.h1',
  'copy.intro',
] as const;
export type LandingTopicField =
  (typeof LANDING_TOPIC_TRANSLATED_FIELDS)[number];

type Localized = Partial<Record<string, string | null>>;

const read = (doc: Record<string, unknown>, field: string): Localized => {
  const value = field
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)?.[key],
      doc,
    );
  return value && typeof value === 'object' ? (value as Localized) : {};
};

/** The slug a name gives, or null when it gives none usable (non-Latin). */
export const autoTopicSlug = (name: string | null | undefined) => {
  const slug = slugify(name ?? '');
  return slug && !topicSlugProblem(slug) ? slug : null;
};

/**
 * Translates a landing-page topic's name and copy from English into every
 * other locale the tenant has, and sets each locale's slug from the
 * translated name unless someone edited it (docs/landing-pages.md, Topics).
 * A locale whose name has no Latin slug keeps it empty, so its pages use the
 * default locale's slug.
 */
export const translateLandingTopic: TaskConfig<'translateLandingTopic'> = {
  slug: 'translateLandingTopic',
  retries: 2,
  inputSchema: [
    { name: 'topicId', type: 'number', required: true },
    {
      name: 'fields',
      type: 'select',
      hasMany: true,
      options: [...LANDING_TOPIC_TRANSLATED_FIELDS],
    },
  ],
  outputSchema: [{ name: 'translated', type: 'number', required: true }],
  handler: async ({ input, req }) => {
    const { payload } = req;
    const topic = (await payload.findByID({
      collection: 'landing-page-topics',
      id: input.topicId,
      locale: 'all',
      depth: 0,
      trash: true,
    })) as unknown as Record<string, unknown> & { tenant: unknown };
    const tenantId =
      typeof topic.tenant === 'object' && topic.tenant
        ? (topic.tenant as { id: string }).id
        : (topic.tenant as string);
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      depth: 0,
    });
    const targets = ((tenant.enabledLocales ?? []) as string[]).filter(
      (locale) => locale !== defaultLocale,
    );
    const fields = (
      input.fields?.length ? input.fields : LANDING_TOPIC_TRANSLATED_FIELDS
    ) as LandingTopicField[];

    const requests = targets.flatMap((locale) =>
      fields.flatMap((field) => {
        const source = read(topic, field)[defaultLocale];
        if (!source?.trim()) return [];
        const masked = maskTemplateTags(source);
        return [{ id: `${locale}|${field}`, locale, field, masked }];
      }),
    );
    if (requests.length === 0) return { output: { translated: 0 } };

    const results = await retry({ times: 3, delay: 1000 }, () =>
      batchTranslate(
        'google',
        requests.map((r) => ({
          id: r.id,
          text: r.masked.text,
          targetLocale: r.locale,
        })),
      ),
    );
    const byId = new Map(results.map((r) => [r.id, r.translatedText]));

    const names = read(topic, 'name');
    const slugs = read(topic, 'slug');
    for (const locale of targets) {
      const data: Record<string, unknown> = {};
      const copy: Record<string, string> = {};
      for (const r of requests.filter((r) => r.locale === locale)) {
        const translated = byId.get(r.id);
        if (!translated) continue;
        const value = unmaskTemplateTags(translated, r.masked.tags);
        if (r.field === 'name') data.name = value;
        else copy[r.field.slice('copy.'.length)] = value;
      }
      if (Object.keys(copy).length) data.copy = copy;
      if (typeof data.name === 'string') {
        // Replace the slug only while it is still the one the old name gave.
        const current = slugs[locale] ?? null;
        if (!current || current === autoTopicSlug(names[locale])) {
          data.slug = autoTopicSlug(data.name);
        }
      }
      if (Object.keys(data).length === 0) continue;
      // No `req`: jobs of one run share it, and a Local API call writes its
      // `locale` onto it, so concurrent topics would save into each other's
      // locales (one topic's Amharic name landing in Spanish).
      await payload.update({
        collection: 'landing-page-topics',
        id: input.topicId,
        locale: locale as never,
        data,
        context: { skipLandingTopicTranslation: true },
        trash: true,
      });
    }

    log.info(
      {
        topicId: input.topicId,
        locales: targets.length,
        texts: requests.length,
      },
      'Landing topic translated',
    );
    return { output: { translated: requests.length } };
  },
};
