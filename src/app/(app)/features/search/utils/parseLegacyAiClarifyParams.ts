import qs from 'qs';

import type {
  AiClassificationScenario,
  AiPredictOption,
} from '@/app/(app)/shared/services/ai-classification-search-service';

import type { RawSearchParams } from './parseSearchParams';
import { parseBoolean, parseNumberOrNull } from '@/utils';
import { normalizeIndexedCollection } from '@/utils/normalizeIndexedCollection';

const VALID_AI_SCENARIOS: ReadonlySet<AiClassificationScenario> = new Set([
  'search',
  'clarify_low_info',
  'clarify_multiple_labels',
  'search_and_notify_low_info',
  'search_and_notify_low_confidence',
]);

type ParsedAiOption = Partial<{
  code: unknown;
  pre_selected: unknown;
  results_count: unknown;
  score: unknown;
}>;

export type LegacyAiClarifyState = {
  autoOpenDialog: boolean;
  scenario?: AiClassificationScenario;
  options: AiPredictOption[];
  selectedCodes: string[];
};

function parseScenario(value: unknown): AiClassificationScenario | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  if (!VALID_AI_SCENARIOS.has(value as AiClassificationScenario)) {
    return undefined;
  }

  return value as AiClassificationScenario;
}

function parseOptions(value: unknown): AiPredictOption[] {
  const rawOptions = normalizeIndexedCollection<ParsedAiOption>(value);

  return rawOptions
    .map((option) => {
      const code =
        typeof option.code === 'string' ? option.code.trim() : undefined;

      if (!code) {
        return null;
      }

      const score = parseNumberOrNull(option.score) ?? 0;
      const resultsCount = parseNumberOrNull(option.results_count);

      return {
        code,
        pre_selected: parseBoolean(option.pre_selected),
        results_count: resultsCount,
        score,
      } satisfies AiPredictOption;
    })
    .filter((option): option is AiPredictOption => option !== null);
}

export function parseLegacyAiClarifyParams(
  rawParams: RawSearchParams,
): LegacyAiClarifyState | null {
  const entries = Object.entries(rawParams).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? '']).map(
      (entry) => [key, entry] as [string, string],
    ),
  );

  const parsed = qs.parse(new URLSearchParams(entries).toString()) as Record<
    string,
    unknown
  >;

  const scenario = parseScenario(parsed.ai_scenario);
  const options = parseOptions(parsed.ai_options);
  const selectedCodes = options
    .filter((option) => option.pre_selected)
    .map((option) => option.code);
  const autoOpenDialog = Boolean(scenario);

  if (!scenario && options.length === 0 && selectedCodes.length === 0) {
    return null;
  }

  return {
    autoOpenDialog,
    options,
    scenario,
    selectedCodes,
  };
}
