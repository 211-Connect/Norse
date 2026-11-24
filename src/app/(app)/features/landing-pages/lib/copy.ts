/**
 * Landing-page copy (docs/landing-pages.md, "Page copy"): four texts, each
 * taken from the first layer that has it (topic override → Resource
 * Directory template → built-in default for the locale), then its
 * `{tags}` filled. Pure, so the page, the sitemap and the admin previews
 * share it.
 */

export const COPY_FIELDS = ['title', 'description', 'h1', 'intro'] as const;
export type CopyField = (typeof COPY_FIELDS)[number];
export type CopyTexts = Partial<Record<CopyField, string | null | undefined>>;

/** Layers from the most specific to the least. */
export const COPY_SOURCES = ['topic', 'template', 'default'] as const;
export type CopySource = (typeof COPY_SOURCES)[number];
export type CopyLayers = Partial<Record<CopySource, CopyTexts | null>>;

/** Google cuts titles and descriptions at about these lengths. */
export const COPY_LIMITS: Partial<Record<CopyField, number>> = {
  title: 60,
  description: 155,
};

export const COPY_TAGS = [
  'topic',
  'location',
  'state',
  'name',
  'phone',
  'email',
] as const;
export type CopyTag = (typeof COPY_TAGS)[number];
export type CopyTagValues = Partial<Record<CopyTag, string | null | undefined>>;

// `{topic}` but not `{{topic}}`.
const TAG = new RegExp(`(?<!\\{)\\{(${COPY_TAGS.join('|')})\\}(?!\\})`, 'g');

const present = (text: string | null | undefined): text is string =>
  typeof text === 'string' && text.trim() !== '';

export type PickedText = { text: string; source: CopySource };

/** The template each field uses, and the layer it came from. */
export function pickCopy(
  layers: CopyLayers,
  below?: CopySource,
): Partial<Record<CopyField, PickedText>> {
  const start = below ? COPY_SOURCES.indexOf(below) + 1 : 0;
  const picked: Partial<Record<CopyField, PickedText>> = {};
  for (const field of COPY_FIELDS) {
    for (const source of COPY_SOURCES.slice(start)) {
      const text = layers[source]?.[field];
      if (present(text)) {
        picked[field] = { text, source };
        break;
      }
    }
  }
  return picked;
}

/**
 * Replaces known tags; a known tag without a value becomes ''. Unknown tags
 * are left as typed. Runs of spaces left by empty tags collapse.
 */
export function fillCopyTags(text: string, values: CopyTagValues): string {
  if (!text.includes('{')) return text;
  return (
    text
      .replace(TAG, (_, tag: CopyTag) => values[tag]?.trim() ?? '')
      .replace(/[ \t]{2,}/g, ' ')
      // Only `,` and `.`: French puts a space before `;:!?`.
      .replace(/ +([,.])/g, '$1')
      .trim()
  );
}

/** Every field, picked and filled. A field no layer has is ''. */
export function fillCopy(
  layers: CopyLayers,
  values: CopyTagValues,
): Record<CopyField, string> {
  const picked = pickCopy(layers);
  return Object.fromEntries(
    COPY_FIELDS.map((field) => [
      field,
      picked[field] ? fillCopyTags(picked[field].text, values) : '',
    ]),
  ) as Record<CopyField, string>;
}

/** Locale strings use i18next's `{{tag}}`; copy uses `{tag}`. */
export const fromI18nTags = (text: string) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, '{$1}');

export type RegionStrings = {
  /** e.g. "{{name}} County", "Condado de {{name}}". */
  county: string;
  /** e.g. "{{name}}, {{state}}". */
  place: string;
};

const interpolate = (pattern: string, values: Record<string, string>) =>
  pattern.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => values[key] ?? match);

/**
 * The region's name as a page in `strings`' locale shows it: "Washington",
 * "Pierce County" / "Condado de Pierce", "Tacoma, WA". Index names carry the
 * state ("Pierce County, WA"); it is dropped. Only "… County" is translated;
 * parishes and boroughs keep their name.
 */
export function regionDisplayName(
  region: { type: 'state' | 'county' | 'place'; name: string; state: string },
  strings: RegionStrings,
  stateName: string,
): string {
  if (region.type === 'state') return stateName;
  const name = region.name.replace(/,\s*[A-Z]{2}$/, '').trim();
  if (region.type === 'place') {
    return interpolate(strings.place, { name, state: region.state });
  }
  const county = name.match(/^(.*\S)\s+County$/i);
  return county ? interpolate(strings.county, { name: county[1] }) : name;
}
