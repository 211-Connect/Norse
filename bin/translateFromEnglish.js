const TextTranslationClient =
  require('@azure-rest/ai-translation-text').default;
const IORedis = require('ioredis').default;
const { flatten, unflatten } = require('flat');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const translateCedential = {
  key: process.env.AZURE_TRANSLATE_API_KEY,
  region: 'global',
};

const translationClient = TextTranslationClient(
  'https://api.cognitive.microsofttranslator.com',
  translateCedential,
);

const _redisPort = Number(process.env.REDIS_PORT);
const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST,
  PORT: isNaN(_redisPort) ? 25061 : _redisPort,
  USERNAME: process.env.REDIS_USERNAME,
  PASSWORD: process.env.REDIS_PASSWORD,
};

const client = new IORedis({
  host: REDIS_CONFIG.HOST,
  port: REDIS_CONFIG.PORT,
  username: REDIS_CONFIG.USERNAME,
  password: REDIS_CONFIG.PASSWORD,
  maxRetriesPerRequest: null,
  db: 0,
  tls: {
    rejectUnauthorized: false,
  },
});

const createRedisKey = (prefix, text) => {
  let hashed_key = crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');

  hashed_key = `${prefix}:${hashed_key}`;

  return hashed_key;
};

const translateText = async (text, targetLanguage) => {
  const inputText = [{ text }];
  const translateResponse = await translationClient.path('/translate').post({
    body: inputText,
    queryParameters: {
      to: targetLanguage,
      from: 'en',
    },
  });

  return translateResponse;
};

const fileBlacklist = new Set([
  'categories.json',
  'dynamic.json',
  'suggestions.json',
]);
// Utility function for updating translations in application
async function translateFromEnglish() {
  const localesDir = path.resolve('./public/locales');

  // English files for source reference
  const enFiles = fs
    .readdirSync(path.resolve(localesDir, 'en'))
    .filter((file) => !fileBlacklist.has(file));

  // Locales to translate in to
  const locales = fs.readdirSync(localesDir).filter((dir) => dir != 'en');

  for (const _file of enFiles) {
    const file = flatten(
      JSON.parse(fs.readFileSync(path.resolve(localesDir, 'en', _file))),
    );

    for (const locale of locales) {
      const newFile = {};

      for (const key in file) {
        const text = file[key];
        const redisKey = createRedisKey(locale, text);
        const cachedValue = await client.get(redisKey);

        if (text.trim().length === 0) {
          newFile[key] = text.trim();
          continue;
        }

        if (!cachedValue || cachedValue === '[object Object]') {
          console.log({ cachedValue });

          const translated = await translateText(text, locale);
          const translatedText = translated?.body?.[0].translations?.[0]?.text;

          if (!translatedText) {
            console.log(translated);
            throw translated;
          }

          await client.set(redisKey, translatedText);
          newFile[key] = translatedText;
        } else {
          newFile[key] = cachedValue;
        }
      }

      fs.writeFileSync(
        path.resolve(localesDir, locale, _file),
        JSON.stringify(unflatten(newFile), null, 2),
      );
    }
  }

  await client.quit();
}

translateFromEnglish();
