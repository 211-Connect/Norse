import crypto from 'crypto';
import TextTranslationClient, {
  isUnexpected,
} from '@azure-rest/ai-translation-text';
import { TranslationServiceClient } from '@google-cloud/translate';
import { translationCacheService } from '@/cacheService';

const LANGUAGE_ALIAS = {
  mww: 'hmn',
};

export type TranslationEngine = 'azure' | 'google';

export interface TranslationResult {
  text: string;
  fromCache: boolean;
}

export interface BatchTranslationInput {
  id?: string;
  text: string;
  targetLocale: string;
}

export interface BatchTranslationResult {
  id?: string;
  text: string;
  translatedText: string;
  targetLocale: string;
  fromCache: boolean;
}

const CACHE_DB = 1;
const CACHE_TTL = 31536000; // 1 year in seconds

function createTextHash(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function createCacheKey(
  engine: TranslationEngine,
  locale: string,
  englishText: string,
): string {
  const hash = createTextHash(englishText);
  return `${engine}:${locale}:${hash}`;
}

async function translateWithAzure(
  texts: string[],
  targetLocale: string,
): Promise<string[]> {
  const apiKey = process.env.AZURE_TRANSLATOR_KEY;
  const endpoint =
    process.env.AZURE_TRANSLATOR_ENDPOINT ||
    'https://api.cognitive.microsofttranslator.com';
  const region = process.env.AZURE_TRANSLATOR_REGION || 'global';

  if (!apiKey) {
    throw new Error('AZURE_TRANSLATOR_KEY is not configured');
  }

  const client = TextTranslationClient(endpoint, {
    key: apiKey,
    region: region,
  });

  const inputText = texts.map((text) => ({ text }));
  const translateResponse = await client.path('/translate').post({
    body: inputText,
    queryParameters: {
      to: targetLocale,
      from: 'en',
    },
  });

  if (isUnexpected(translateResponse)) {
    throw new Error(
      `Azure translation failed: ${translateResponse.body.error?.message || 'Unknown error'}`,
    );
  }

  return translateResponse.body.map((item) => item.translations[0].text);
}

async function translateWithGoogle(
  texts: string[],
  targetLocale: string,
): Promise<string[]> {
  const credentialsBase64 = process.env.GOOGLE_TRANSLATE_CREDENTIALS_BASE64;

  if (!credentialsBase64) {
    throw new Error('GOOGLE_TRANSLATE_CREDENTIALS_BASE64 is not configured');
  }

  const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString(
    'utf-8',
  );
  const credentials = JSON.parse(credentialsJson);
  const client = new TranslationServiceClient({ credentials });
  const projectId = credentials.project_id;
  const location = 'global';

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: texts,
    mimeType: 'text/plain',
    sourceLanguageCode: 'en',
    targetLanguageCode: LANGUAGE_ALIAS[targetLocale] || targetLocale,
  };

  const [response] = await client.translateText(request);
  return response.translations?.map((t) => t.translatedText || '') || [];
}

export async function batchTranslate(
  engine: TranslationEngine,
  inputs: BatchTranslationInput[],
): Promise<BatchTranslationResult[]> {
  const results: BatchTranslationResult[] = new Array(inputs.length);

  const inputsWithIndex = inputs.map((input, index) => ({ input, index }));

  const byLocale = inputsWithIndex.reduce<
    Record<string, typeof inputsWithIndex>
  >((acc, item) => {
    if (!acc[item.input.targetLocale]) {
      acc[item.input.targetLocale] = [];
    }
    acc[item.input.targetLocale].push(item);
    return acc;
  }, {});

  for (const [locale, localeInputs] of Object.entries(byLocale)) {
    const textsToTranslate: string[] = [];
    const itemsToTranslate: typeof inputsWithIndex = [];

    for (const item of localeInputs) {
      const cacheKey = createCacheKey(engine, locale, item.input.text);
      const cached = await translationCacheService.get(cacheKey);

      if (cached) {
        results[item.index] = {
          id: item.input.id,
          text: item.input.text,
          translatedText: cached,
          targetLocale: locale,
          fromCache: true,
        };
      } else {
        textsToTranslate.push(item.input.text);
        itemsToTranslate.push(item);
      }
    }

    if (textsToTranslate.length > 0) {
      let translations: string[];

      if (engine === 'azure') {
        translations = await translateWithAzure(textsToTranslate, locale);
      } else {
        translations = await translateWithGoogle(textsToTranslate, locale);
      }

      for (let i = 0; i < translations.length; i++) {
        const item = itemsToTranslate[i];
        const translatedText = translations[i];
        const cacheKey = createCacheKey(engine, locale, item.input.text);

        await translationCacheService.set(cacheKey, translatedText, CACHE_TTL);

        results[item.index] = {
          id: item.input.id,
          text: item.input.text,
          translatedText,
          targetLocale: locale,
          fromCache: false,
        };
      }
    }
  }

  return results;
}

export async function translate(
  engine: TranslationEngine,
  text: string,
  targetLocale: string,
): Promise<TranslationResult> {
  const results = await batchTranslate(engine, [{ text, targetLocale }]);
  const result = results[0];

  return {
    text: result.translatedText,
    fromCache: result.fromCache,
  };
}
