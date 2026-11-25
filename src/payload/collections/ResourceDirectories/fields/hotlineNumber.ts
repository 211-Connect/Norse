import type { TextFieldSingleValidation } from 'payload';

export const HOTLINE_NUMBER_MESSAGE =
  'Enter a phone number or short code, for example 988 or 1-800-799-7233.';

/**
 * A hotline number is a phone number or short code: digits, spaces, hyphens,
 * dots and parentheses, with an optional leading "+", and 2 to 15 digits.
 */
export function isValidHotlineNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\+?[0-9\s\-.()]+$/.test(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= 2 && digits <= 15;
}

export const validateHotlineNumber: TextFieldSingleValidation = (value) =>
  typeof value === 'string' && isValidHotlineNumber(value)
    ? true
    : HOTLINE_NUMBER_MESSAGE;

export const HOTLINE_LABEL_MESSAGE = 'Enter a name for this hotline.';

/** A blank label is dropped from the cache, so a crisis number would vanish silently: reject it here. */
export const validateHotlineLabel: TextFieldSingleValidation = (value) =>
  typeof value === 'string' && value.trim() !== ''
    ? true
    : HOTLINE_LABEL_MESSAGE;
