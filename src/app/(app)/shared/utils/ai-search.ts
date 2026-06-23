import { ResourceEntry } from '../lib/umami';
import {
  AiPredictOption,
  AiClassificationScenario,
} from '../services/ai-classification-search-service';
import { parseCommaSeparatedValues } from './parseCommaSeparatedValues';

type BuildAiSearchUrlArgs = {
  scenario?: AiClassificationScenario;
  query: string;
  queryLabel?: string;
  taxonomies?: string[] | null | undefined;
};

export function normalizeHsisTaxonomies(
  hsisTaxonomies: string[] | null | undefined,
): string[] {
  return parseCommaSeparatedValues(hsisTaxonomies ?? undefined) ?? [];
}

export function buildAiSearchUrl({
  scenario,
  query,
  queryLabel,
  taxonomies,
}: BuildAiSearchUrlArgs): string {
  const params = new URLSearchParams();

  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    params.set('query', normalizedQuery);
  }

  const normalizedQueryLabel = queryLabel?.trim();
  if (normalizedQueryLabel) {
    params.set('query_label', normalizedQueryLabel);
  }

  params.set('query_type', 'hybrid');
  params.set('entry', ResourceEntry.SearchCard);

  const normalizedTaxonomies = normalizeHsisTaxonomies(taxonomies);
  if (normalizedTaxonomies.length > 0) {
    params.set('taxonomy', normalizedTaxonomies.join(','));
  }

  if (scenario === 'search_and_notify_low_info') {
    params.set('a', 'low_info');
  } else if (scenario === 'search_and_notify_low_confidence') {
    params.set('a', 'low_confidence');
  }

  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ''}`;
}

export function buildAiNeedWeights(
  options: AiPredictOption[],
  selectedCodes: string[],
): Record<string, number> {
  const selectedCodesSet = new Set(selectedCodes);
  const optionsByCode = new Map(options.map((option) => [option.code, option]));
  const needWeightsEntries = new Map<string, number>();

  for (const option of options) {
    const isSelected = selectedCodesSet.has(option.code);

    if (isSelected) {
      if (option.pre_selected) {
        if (typeof option.score === 'number' && Number.isFinite(option.score)) {
          needWeightsEntries.set(option.code, option.score);
        }
      } else {
        needWeightsEntries.set(option.code, 0.6);
      }
    } else if (option.pre_selected) {
      needWeightsEntries.set(option.code, 0.1);
    }
  }

  for (const code of selectedCodesSet) {
    if (needWeightsEntries.has(code)) {
      continue;
    }

    const option = optionsByCode.get(code);
    if (!option) {
      needWeightsEntries.set(code, 0.6);
    }
  }

  return Object.fromEntries(
    [...needWeightsEntries.entries()].filter(
      ([, value]) => typeof value === 'number' && Number.isFinite(value),
    ),
  );
}
