import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mater from 'matercolors';

dotenv.config();

const PREBUILD_PACKAGE_NAME = process.env.PREBUILD_PACKAGE_NAME;
(async function () {
  // Run prebuild package if provided
  if (PREBUILD_PACKAGE_NAME) {
    try {
      await installPackage(PREBUILD_PACKAGE_NAME);
      const plugin = await import(PREBUILD_PACKAGE_NAME);

      if (plugin && plugin.build) {
        await plugin.build();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const norseConfig = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'norse.config.json'), 'utf-8')
  );

  const primary = new mater(norseConfig.theme.primaryColor);
  const primaryColors: any = [];
  for (const key in primary.palette.primary) {
    primaryColors.push(primary.palette.primary[key]);
  }

  let primaryShade: any = 0;
  for (let i = 0; i < 10; i++) {
    if (
      primaryColors[i].toLowerCase() ===
      norseConfig.theme.primaryColor.toLowerCase()
    ) {
      primaryShade = i;
    }
  }

  const secondary = new mater(norseConfig.theme.secondaryColor);
  const secondaryColors: any = [];
  for (const key in secondary.palette.primary) {
    secondaryColors.push(secondary.palette.primary[key]);
  }

  let secondaryShade: any = 0;
  for (let i = 0; i < 10; i++) {
    if (
      secondaryColors[i].toLowerCase() ===
      norseConfig.theme.secondaryColor.toLowerCase()
    ) {
      secondaryShade = i;
    }
  }

  norseConfig.theme.primaryShade = primaryShade;
  norseConfig.theme.secondaryShade = secondaryShade;
  norseConfig.theme.primaryPalette = primaryColors;
  norseConfig.theme.secondaryPalette = secondaryColors;

  fs.writeFileSync(
    path.join(process.cwd(), '.norse', 'norse.config.js'),
    `module.exports = ${JSON.stringify(norseConfig)}`
  );
})();

function installPackage(packageName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`npm i ${packageName} --no-save`, (err, stdout, stderr) => {
      if (err) reject(err);
      if (stderr) console.error(stderr);
      if (stdout) console.log(stdout);
      resolve();
    });
  });
}
