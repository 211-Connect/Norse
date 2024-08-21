import path from 'path';
import fs from 'fs/promises';
import { GetServerSidePropsContext } from 'next';

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

const isProduction = process.env.NODE_ENV === 'production';
export function cacheControl(ctx: GetServerSidePropsContext) {
  if (isProduction) {
    ctx.res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
    );
  }
}
