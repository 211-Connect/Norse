/** Demo only: the v2 response box shows only when this flag is "true". Default off. */
export function demoPeekEnabled(value: string | undefined): boolean {
  return value === 'true';
}

// Next.js inlines NEXT_PUBLIC_* only for a literal `process.env.NAME` read.
export const DEMO_PEEK_ENABLED = demoPeekEnabled(
  process.env.NEXT_PUBLIC_DEMO_V2_PEEK,
);
