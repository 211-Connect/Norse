import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { v2 } from '@google-cloud/translate';
import { flatten, unflatten } from 'flat';
dotenv.config();

const googleEnv = JSON.parse(process.env.GOOGLE_API_KEY || '');
const locales = process.env.TRANSLATE_LOCALES;
const Translate = v2.Translate;
const translate = new Translate({
  credentials: googleEnv,
  projectId: googleEnv.project_id,
});
if (!googleEnv) {
  throw Error('GOOGLE_API_KEY not found in .env');
}
if (!locales) {
  throw Error('TRANSLATE_LOCALES not found in .env');
}

async function translateLocaleFiles() {
  const localesToTranslate = locales?.split(',') ?? [];
  const localeFiles = fs.readdirSync(
    path.resolve(process.cwd(), 'public', 'locales', 'en')
  );
  const filteredLocaleFiles = localeFiles.filter(
    (file) => !file.startsWith('dynamic')
  );

  for (const locale of localesToTranslate) {
    fs.mkdirpSync(path.resolve(process.cwd(), 'public', 'locales', locale));

    for (const file of filteredLocaleFiles) {
      const filePath = path.resolve(
        process.cwd(),
        'public',
        'locales',
        'en',
        file
      );
      const fileData = fs.readFileSync(filePath);
      const data: any = flatten(JSON.parse(fileData.toString()));

      for (const key in data) {
        const [translatedValue] = await translate.translate(data[key], {
          from: 'en',
          to: locale,
        });
        data[key] = translatedValue;
      }

      fs.writeFileSync(
        path.resolve(process.cwd(), 'public', 'locales', locale, file),
        JSON.stringify(unflatten(data), null, 2)
      );
    }
  }
}

translateLocaleFiles();
