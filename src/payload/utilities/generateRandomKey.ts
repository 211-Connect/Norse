import { randomBytes } from 'crypto';

export function generateRandomKey(length = 36): string {
  // Generate enough random bytes, convert to hex, and truncate to the requested length.
  // Each byte becomes two hex characters, so we need ceil(length / 2) bytes.
  const bytes = randomBytes(Math.ceil(length / 2));
  const hex = bytes.toString('hex');
  return hex.slice(0, length);
}
