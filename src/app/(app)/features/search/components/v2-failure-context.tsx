'use client';

import { createContext, useContext } from 'react';

/** Whether the `/v2/search` call failed, and the way to try it again. */
export type V2Failure = {
  failed: boolean;
  retry: () => void;
  retrying: boolean;
};

const NOT_FAILED: V2Failure = {
  failed: false,
  retry: () => undefined,
  retrying: false,
};

const V2FailureContext = createContext<V2Failure>(NOT_FAILED);

export const V2FailureProvider = V2FailureContext.Provider;

/**
 * True while the v2 call has failed and has no usable answer (see `v2CallFailed`). Without the
 * bridge (v1, or a v2 engine that is off) it is always "not failed", so v1 stays as it was.
 */
export const useV2Failure = () => useContext(V2FailureContext);
