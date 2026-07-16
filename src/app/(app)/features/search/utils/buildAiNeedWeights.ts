import { AiPredictOption } from '../../../shared/services/ai-classification-search-service';

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
