/**
 * Template tags tenant admins can type into any Payload-configured text
 * (page content, footer, meta, menus, …). `buildAppConfig` replaces them with
 * the tenant's own values. See docs/template-tags.md.
 */
export const TEMPLATE_TAGS = ['name', 'phone', 'email'] as const;

export type TemplateTag = (typeof TEMPLATE_TAGS)[number];

export type TemplateTagValues = Record<TemplateTag, string | undefined>;

// `{name}` but not `{{name}}`, so i18next-style `{{…}}` interpolation in
// translated strings is left alone.
const TAG_PATTERN = new RegExp(
  `(?<!\\{)\\{(${TEMPLATE_TAGS.join('|')})\\}(?!\\})`,
  'g',
);

/** Replaces template tags in one string. A tag with no value becomes ''. */
export function replaceTemplateTags(
  text: string,
  values: TemplateTagValues,
): string {
  if (!text.includes('{')) return text;
  return text.replace(
    TAG_PATTERN,
    (_, tag: TemplateTag) => values[tag]?.trim() ?? '',
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Returns a copy of `value` with template tags replaced in every string it
 * contains, walking plain objects and arrays. Other values are kept as-is.
 */
export function applyTemplateTags<T>(value: T, values: TemplateTagValues): T {
  if (typeof value === 'string') {
    return replaceTemplateTags(value, values) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyTemplateTags(item, values)) as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = applyTemplateTags(item, values);
    }
    return result as T;
  }
  return value;
}
