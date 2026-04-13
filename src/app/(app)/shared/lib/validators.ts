/**
 * Validates a phone number by stripping common formatting characters (spaces,
 * dashes, parentheses, dots) and checking that the remaining digit sequence
 * falls within the E.164 length range (10–15 digits), with an optional
 * leading +. Accepts formatted input such as "(555) 123-4567" or "+1 800 555 0100".
 */
export function validatePhoneNumber(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const normalized = value.replace(/[\s\-().]/g, '');
  return /^\+?\d{10,15}$/.test(normalized);
}

export function validateCoordsString(coordsStr?: string | null): boolean {
  if (!coordsStr) {
    return true;
  }

  const splittedCoords = coordsStr.split(',');
  if (splittedCoords.length !== 2) {
    return false;
  }

  const [lon, lat] = splittedCoords;
  const numberRegex = /^-?\d+(\.\d+)?$/;

  if (!numberRegex.test(lon) || !numberRegex.test(lat)) return false;

  return true;
}
