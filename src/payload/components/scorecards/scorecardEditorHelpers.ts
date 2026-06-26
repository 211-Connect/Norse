import { NeedWeights } from '@/types/taxonomyScorecard';

import { NEED_DEFINITIONS } from './constants';

export function validateScorecardWeights(
  weightInputs: Record<string, string>,
): {
  parsedWeights: NeedWeights | null;
  errors: Record<string, string>;
} {
  const parsed: NeedWeights = {};
  const errors: Record<string, string> = {};

  for (const need of NEED_DEFINITIONS) {
    const raw = weightInputs[need.code] ?? '';
    const value = Number(raw);

    if (!need.code.trim()) {
      errors[need.code] = 'Need code must be non-empty.';
      continue;
    }

    if (!Number.isFinite(value)) {
      errors[need.code] = 'Weight must be a finite number.';
      continue;
    }

    if (value < 0 || value > 1) {
      errors[need.code] = 'Weight must be between 0 and 1.';
      continue;
    }

    parsed[need.code] = value;
  }

  return {
    parsedWeights: Object.keys(errors).length === 0 ? parsed : null,
    errors,
  };
}

export function parseVersionId(versionId: string): number | null {
  const versionIdNumber = Number(versionId);

  if (!Number.isInteger(versionIdNumber)) {
    return null;
  }

  return versionIdNumber;
}
