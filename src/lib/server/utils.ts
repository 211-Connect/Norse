import fs from 'fs/promises';
import path from 'path';

export async function serverSideAppConfig() {
  let appConfig;
  let rawData;
  try {
    await fs.stat(path.resolve('./app.config.json'));
    rawData = await fs.readFile(path.resolve('./app.config.json'));
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
    appConfig = JSON.parse(rawData.toString());
  } catch (err) {
    console.error('Unable to parse app.config', err);
    appConfig = {};
  }

  return {
    appConfig,
  };
}
