import {
  createFeedbackEvent,
  createLinkEvent,
  createPageViewEvent,
  createReferralEvent,
  createResultsEvent,
  createTourEvent,
} from './events';

export function useEventStore() {
  return {
    createFeedbackEvent,
    createLinkEvent,
    createPageViewEvent,
    createReferralEvent,
    createResultsEvent,
    createTourEvent,
  };
}
