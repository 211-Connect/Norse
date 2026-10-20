import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time check that a received shared secret (e.g. the
 * `x-internal-api-key` header) equals the expected one. False when either is
 * missing. Lengths are compared first, which only reveals the secret's
 * length, not its content.
 */
export function secretsMatch(
  received: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!received || !expected) {
    return false;
  }

  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);

  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}
