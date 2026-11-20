/**
 * The no-dial switch (Lucas, 2026-11-20): ON in every environment. While on, no 911, 988, help
 * line or provider phone dials or texts. Every real number is already wired to `tel:` behind it;
 * a separate turn-on PR flips this before a tenant goes live on v2 in production.
 */
export const NO_DIAL = true;
