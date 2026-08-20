import { PayloadRequest } from 'payload';

/**
 * Set on `req.context` for writes that should not re-run the expensive
 * ResourceDirectories afterChange side effects (cache pushes, Keycloak sync,
 * API cache invalidation) once per locale. Callers that set this flag are
 * responsible for triggering those side effects once, after all their writes.
 */
export const SKIP_SIDE_EFFECTS_CONTEXT_KEY = 'skipSideEffects';

export function shouldSkipSideEffects(
  context: PayloadRequest['context'] | undefined,
): boolean {
  return context?.[SKIP_SIDE_EFFECTS_CONTEXT_KEY] === true;
}
