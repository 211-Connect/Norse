import type {
  BatchTranslationInput,
  BatchTranslationResult,
  TranslationEngine,
} from '@/payload/services/translationService';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** A batch can hold every field of a directory in every locale. */
const TRANSLATE_TIMEOUT_MS = 30_000;

/**
 * Machine-translates `inputs` (cached in Redis per text and locale). Runs in
 * the CMS, which holds the translation provider credentials; the public app
 * calls it over HTTP. Metering stays with the caller
 * (`runMeteredTranslation`).
 */
export async function translateBatch(
  engine: TranslationEngine,
  inputs: BatchTranslationInput[],
  sourceLocale: string,
): Promise<BatchTranslationResult[]> {
  if (inputs.length === 0) return [];

  // `NORSE_BUILD` is inlined at build time: the public app's build drops
  // this branch and never bundles the translation clients.
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { batchTranslate } =
        await import('@/payload/services/translationService');
      return batchTranslate(engine, inputs, sourceLocale);
    }
  }

  return cmsRequest<BatchTranslationResult[]>('translation/batch', {
    method: 'POST',
    body: { engine, inputs, sourceLocale },
    timeoutMs: TRANSLATE_TIMEOUT_MS,
  });
}
