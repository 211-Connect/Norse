import fs from 'fs/promises';
import path from 'path';

export async function serverSideFavorites() {
  const rawData = await fs.readFile(path.resolve('./.norse/suggestions.json'));
  let suggestions;
  try {
    suggestions = JSON.parse(rawData.toString());
  } catch (err) {
    console.error(err);
    suggestions = [];
  }

  return {
    suggestions,
  };
}

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

export async function serverSideCategories() {
  const rawData = await fs.readFile(path.resolve('./.norse/categories.json'));
  let categories;
  try {
    categories = JSON.parse(rawData.toString());
  } catch (err) {
    console.error(err);
    categories = [];
  }

  return {
    categories,
  };
}
