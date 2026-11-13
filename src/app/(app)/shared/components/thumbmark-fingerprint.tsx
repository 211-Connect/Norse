'use client';

import { Thumbmark } from '@thumbmarkjs/thumbmarkjs';
import { useEffect } from 'react';

let fingerprintPromise: Promise<string | undefined> | undefined;

/** Generate at most once per document, even if page wrappers remount. */
export function getFingerprint(): Promise<string | undefined> {
  if (!fingerprintPromise) {
    fingerprintPromise = createFingerprint();
  }
  return fingerprintPromise;
}

async function createFingerprint(): Promise<string | undefined> {
  try {
    const cached = sessionStorage.getItem('norse:thumbmark');
    if (cached) {
      return cached;
    }
  } catch {
    // Storage may be unavailable; the fingerprint can still be used in memory.
  }

  try {
    const result = await new Thumbmark({ logging: false }).get();
    if (!result.thumbmark) return undefined;
    try {
      sessionStorage.setItem('norse:thumbmark', result.thumbmark);
    } catch {
      // Keep the fingerprint in memory when session storage is unavailable.
    }
    return result.thumbmark;
  } catch {
    return undefined;
  }
}

export function ThumbmarkFingerprint() {
  useEffect(() => {
    void getFingerprint();
  }, []);

  return null;
}
