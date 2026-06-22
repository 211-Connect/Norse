'use client';

import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AiClassificationScenario,
  AiPredictOption,
} from '@/app/(app)/shared/services/ai-classification-search-service';

import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';

type AiClassificationOptionView = {
  code: string;
  preSelected: boolean;
  score: number | null;
  resultsCount: number | null;
};

type AiClassificationOptionsProps = {
  allNeedCodes: string[];
  scenario: AiClassificationScenario | undefined;
  selectedCodes: string[];
  options: AiPredictOption[];
  onToggle: (code: string) => void;
  validationMessage?: string;
  disabled?: boolean;
};

function isFiniteNonNegative(
  value: number | null | undefined,
): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function getUniqueCodes(codes: string[]): string[] {
  return [...new Set(codes.filter((code) => code.trim().length > 0))];
}

const SCENARIO_TO_CLARIFY_TITLE_KEY_MAP: Record<
  AiClassificationScenario,
  string
> = {
  search: 'search.ai_clarify_title',
  clarify_low_info: 'search.ai_clarify_title_low_info',
  clarify_multiple_labels: 'search.ai_clarify_title_multiple_labels',
  search_and_notify_low_info: 'search.ai_clarify_title_low_info',
  search_and_notify_low_confidence: 'search.ai_clarify_title',
};

export function AiClassificationOptions({
  allNeedCodes,
  selectedCodes,
  scenario,
  options,
  onToggle,
  validationMessage,
  disabled = false,
}: AiClassificationOptionsProps) {
  const { t } = useTranslation('common');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const optionsByCode = useMemo(
    () =>
      new Map(
        options.map((option) => [
          option.code,
          {
            code: option.code,
            preSelected: option.pre_selected,
            score: option.score,
            resultsCount:
              typeof option.results_count === 'number' &&
              Number.isFinite(option.results_count)
                ? option.results_count
                : null,
          } satisfies AiClassificationOptionView,
        ]),
      ),
    [options],
  );

  const orderedCodes = useMemo(() => {
    const backendCodes = options.map((option) => option.code);
    return getUniqueCodes([...backendCodes, ...allNeedCodes]);
  }, [allNeedCodes, options]);

  const visibleCodes = useMemo(
    () =>
      showAllCategories ? orderedCodes : options.map((option) => option.code),
    [orderedCodes, options, showAllCategories],
  );

  const shouldShowMoreButton =
    !showAllCategories && orderedCodes.length > options.length;

  const clarifyTitleKey = scenario
    ? SCENARIO_TO_CLARIFY_TITLE_KEY_MAP[scenario]
    : 'search.ai_clarify_title';

  return (
    <div
      className="mt-4 flex flex-col gap-3"
      data-testid="ai-classification-options"
    >
      <Typography variant="heading" size="sm">
        {t(clarifyTitleKey)}
      </Typography>

      <div className="flex flex-col gap-3">
        {visibleCodes.map((code) => {
          const details = optionsByCode.get(code);
          const checked = selectedCodes.includes(code);

          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(code)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                checked
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
              aria-pressed={checked}
            >
              <div
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  checked
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground',
                )}
              >
                {checked && (
                  <Check className="text-primary-foreground size-3" />
                )}
              </div>

              <div className="flex-1">
                <Typography variant="heading" size="xs" className="mb-1">
                  {t(`needs.${code}.name`, { defaultValue: code })}
                </Typography>
                <Typography variant="paragraph" size="xs" textColor="secondary">
                  {t(`needs.${code}.description`, { defaultValue: code })}
                </Typography>
                {isFiniteNonNegative(details?.resultsCount) && (
                  <Typography
                    variant="paragraph"
                    size="xs"
                    textColor="secondary"
                    className="mt-1"
                  >
                    {t('search.ai_option_results_count', {
                      count: details.resultsCount,
                    })}
                  </Typography>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {shouldShowMoreButton ? (
        <div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowAllCategories(true)}
            className="text-primary cursor-pointer text-sm underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('search.ai_show_more_categories')}
          </button>
        </div>
      ) : null}

      {validationMessage ? (
        <Typography
          variant="paragraph"
          size="sm"
          textColor="secondary"
          role="alert"
          className="text-destructive"
        >
          {validationMessage}
        </Typography>
      ) : null}
    </div>
  );
}
