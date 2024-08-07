import path from 'path';
import fs from 'fs/promises';

let config = undefined;
export async function serverSideAppConfig() {
  if (config != null) return { appConfig: config };

  let rawData;
  try {
    await fs.stat(path.resolve('./.norse/config.json'));
    rawData = await fs.readFile(path.resolve('./.norse/config.json'));
  } catch (_err) {
    // file doesn't exist. Don't do anything
  }

  if (!rawData) {
    try {
      rawData = await fs.readFile(path.resolve('./app.defaults.json'));
    } catch (err) {
      console.error('failed to read app.defaults.json', err);
    }
  }

  try {
    config = JSON.parse(rawData.toString());
  } catch (err) {
    console.error('Unable to parse app.config', err);
    config = {};
  }

  return {
    appConfig: config,
  };
}
