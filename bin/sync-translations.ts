#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { batchTranslate } from '../src/payload/services/translationService';
import { locales, defaultLocale } from '../src/payload/i18n/locales';
import type { BatchTranslationInput } from '../src/payload/services/translationService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TranslationStats {
  locale: string;
  file: string;
  translated: number;
  preserved: number;
  total: number;
}

const FILE_BLACKLIST = new Set([
  'categories.json',
  'dynamic.json',
  'suggestions.json',
]);

type NestedObject = { [key: string]: string | NestedObject };

/**
 * Flattens nested JSON object into dot-notation keys
 */
function flatten(obj: NestedObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}

/**
 * Converts flattened object back to nested structure
 */
function unflatten(obj: Record<string, string>): NestedObject {
  const result: NestedObject = {};

  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('.');
    let current: NestedObject = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k] as NestedObject;
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}
/**
 * Load JSON file safely
 */
function loadJsonFile(filePath: string): NestedObject {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as NestedObject;
  } catch (error) {
    console.warn(`⚠️  Failed to parse ${filePath}:`, error);
    return {};
  }
}

/**
 * Find all missing keys in target compared to source
 */
function findMissingKeys(
  source: Record<string, string>,
  target: Record<string, string>,
): string[] {
  const missing: string[] = [];

  for (const key of Object.keys(source)) {
    if (!(key in target) || !target[key] || target[key].trim() === '') {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Sync translations for a single file across all locales
 */
async function syncTranslationFile(
  fileName: string,
  localesDir: string,
  targetLocales: string[],
): Promise<TranslationStats[]> {
  const stats: TranslationStats[] = [];

  // Load English source file
  const enPath = path.join(localesDir, defaultLocale, fileName);
  if (!fs.existsSync(enPath)) {
    console.warn(`⚠️  Source file not found: ${fileName}`);
    return stats;
  }

  const enData = loadJsonFile(enPath);
  const flatEnData = flatten(enData);

  console.log(`\n📄 Processing ${fileName}...`);
  console.log(`   Found ${Object.keys(flatEnData).length} keys in English`);

  // Process each target locale
  for (const locale of targetLocales) {
    const localePath = path.join(localesDir, locale, fileName);
    const existingData = loadJsonFile(localePath);
    const flatExistingData = flatten(existingData);

    // Find missing keys
    const missingKeys = findMissingKeys(flatEnData, flatExistingData);

    if (missingKeys.length === 0) {
      console.log(`   ✅ ${locale}: Already complete`);
      stats.push({
        locale,
        file: fileName,
        translated: 0,
        preserved: Object.keys(flatExistingData).length,
        total: Object.keys(flatEnData).length,
      });
      continue;
    }

    console.log(
      `   🔄 ${locale}: Translating ${missingKeys.length} missing keys...`,
    );

    // Prepare batch translation inputs, filtering out empty strings
    const translationInputs: BatchTranslationInput[] = [];
    const emptyKeys: string[] = [];

    for (const key of missingKeys) {
      const text = flatEnData[key];
      if (!text || text.trim() === '') {
        // Empty strings don't need translation
        flatExistingData[key] = '';
        emptyKeys.push(key);
      } else {
        translationInputs.push({
          id: key,
          text,
          targetLocale: locale,
        });
      }
    }

    let translatedCount = 0;

    // Only translate if there are non-empty strings
    if (translationInputs.length > 0) {
      // Translate in batches
      const batchSize = 100;
      const batches: BatchTranslationInput[][] = [];
      for (let i = 0; i < translationInputs.length; i += batchSize) {
        batches.push(translationInputs.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const results = await batchTranslate('google', batch);

        for (const result of results) {
          if (result.id) {
            flatExistingData[result.id] = result.translatedText;
            translatedCount++;
          }
        }
      }
    }

    // Ensure all keys from English exist (even if translation failed)
    for (const key of Object.keys(flatEnData)) {
      if (!(key in flatExistingData)) {
        flatExistingData[key] = flatEnData[key]; // Fallback to English
      }
    }

    // Write updated file
    const unflattenedData = unflatten(flatExistingData);
    const localeDir = path.join(localesDir, locale);

    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }

    fs.writeFileSync(
      localePath,
      JSON.stringify(unflattenedData, null, 2) + '\n',
    );

    stats.push({
      locale,
      file: fileName,
      translated: translatedCount,
      preserved: Object.keys(flatExistingData).length - translatedCount,
      total: Object.keys(flatEnData).length,
    });

    const emptyCount = emptyKeys.length;
    if (emptyCount > 0) {
      console.log(
        `   ✅ ${locale}: Translated ${translatedCount} keys, ${emptyCount} empty`,
      );
    } else {
      console.log(`   ✅ ${locale}: Translated ${translatedCount} keys`);
    }
  }

  return stats;
}

/**
 * Main sync function
 */
async function syncAllTranslations() {
  const localesDir = path.resolve(__dirname, '../public/locales');

  // Get all English files
  const enDir = path.join(localesDir, defaultLocale);
  const enFiles = fs
    .readdirSync(enDir)
    .filter((file) => file.endsWith('.json') && !FILE_BLACKLIST.has(file));

  // Get target locales (exclude English)
  const targetLocales = locales.filter((locale) => locale !== defaultLocale);

  console.log('🌍 Starting translation sync...');
  console.log(`📁 Source: ${enFiles.length} files in English`);
  console.log(`🎯 Target: ${targetLocales.length} locales`);

  const allStats: TranslationStats[] = [];

  // Process each file
  for (const file of enFiles) {
    const stats = await syncTranslationFile(file, localesDir, targetLocales);
    allStats.push(...stats);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TRANSLATION SUMMARY');
  console.log('='.repeat(60));

  const byLocale = allStats.reduce<Record<string, TranslationStats[]>>(
    (acc, stat) => {
      if (!acc[stat.locale]) {
        acc[stat.locale] = [];
      }
      acc[stat.locale].push(stat);
      return acc;
    },
    {},
  );

  for (const [locale, stats] of Object.entries(byLocale)) {
    const totalTranslated = stats.reduce((sum, s) => sum + s.translated, 0);
    const totalPreserved = stats.reduce((sum, s) => sum + s.preserved, 0);

    console.log(`\n${locale}:`);
    console.log(`  🆕 New translations: ${totalTranslated}`);
    console.log(`  ♻️  Preserved existing: ${totalPreserved}`);
    console.log(`  📄 Files processed: ${stats.length}`);
  }

  const grandTotal = allStats.reduce((sum, s) => sum + s.translated, 0);
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Total new translations: ${grandTotal}`);
  console.log('='.repeat(60) + '\n');
}

// Run the script
syncAllTranslations()
  .then(() => {
    console.log('✅ Translation sync completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Translation sync failed:', error);
    process.exit(1);
  });
