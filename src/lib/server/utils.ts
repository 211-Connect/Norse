import fs from 'fs/promises';
import path from 'path';

export async function serverSideAppConfig() {
  const rawData = await fs.readFile(path.resolve('./.norse/config.json'));
  let appConfig;
  try {
    appConfig = JSON.parse(rawData.toString());
  } catch (err) {
    console.error(err);
    appConfig = {};
  }

  return {
    appConfig,
  };
}
