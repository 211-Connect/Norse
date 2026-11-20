import type { SearchEngine } from '@/types/appConfig';

/**
 * What a slot does when the URL leaves it unstated: `gate` may hold the page back until it is known,
 * `refine` lets results show and narrows them once it is. Search is permissive, so refine is the default.
 */
export type SlotPolicy = 'gate' | 'refine';

/** The slots whose policy a tenant can set. */
export type SearchPolicy = {
  /** Clarifying the user's need: the only slot that may hold back results on the page. */
  needs: SlotPolicy;
  /** The user's location: today a gate on the dialog submit only (ISS-2415 gates the page). */
  location: SlotPolicy;
};

/**
 * A tenant's policy, derived from the config it already has (decided 2026-10-19 on ISS-2294): needs is a
 * gate on AI-classification tenants, location is a gate where `requireUserLocation` is on. A Payload
 * setting comes when a tenant first needs to gate another slot.
 */
export function searchPolicy({
  searchEngine,
  requireUserLocation,
}: {
  searchEngine: SearchEngine;
  requireUserLocation: boolean;
}): SearchPolicy {
  return {
    needs: searchEngine === 'ai_classification' ? 'gate' : 'refine',
    location: requireUserLocation ? 'gate' : 'refine',
  };
}
