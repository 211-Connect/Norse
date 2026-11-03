import { internalRoute } from '@/lib/cms/internal-route';
import {
  type BatchTranslationInput,
  type TranslationEngine,
  batchTranslate,
} from '@/payload/services/translationService';

const ENGINES: TranslationEngine[] = ['google', 'azure'];
/** Bounds one request; the app's field length limits keep real ones far below. */
const MAX_INPUTS = 500;
const MAX_TOTAL_CHARACTERS = 200_000;

function isInput(value: unknown): value is BatchTranslationInput {
  const input = value as BatchTranslationInput;
  return (
    typeof input?.text === 'string' &&
    typeof input?.targetLocale === 'string' &&
    (input.id === undefined || typeof input.id === 'string')
  );
}

/**
 * POST { engine, inputs, sourceLocale } → `BatchTranslationResult[]` in
 * input order. The caller meters the usage (`fromCache` marks free results).
 */
export const POST = internalRoute(async (request) => {
  const body = await request.json().catch(() => null);
  const inputs: unknown[] = Array.isArray(body?.inputs) ? body.inputs : [];

  if (
    !ENGINES.includes(body?.engine) ||
    typeof body?.sourceLocale !== 'string' ||
    inputs.length === 0 ||
    inputs.length > MAX_INPUTS ||
    !inputs.every(isInput)
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const totalCharacters = (inputs as BatchTranslationInput[]).reduce(
    (total, input) => total + input.text.length,
    0,
  );
  if (totalCharacters > MAX_TOTAL_CHARACTERS) {
    return Response.json({ error: 'Too much text' }, { status: 413 });
  }

  return batchTranslate(
    body.engine,
    inputs as BatchTranslationInput[],
    body.sourceLocale,
  );
});
