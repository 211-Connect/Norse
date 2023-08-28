const fs = require('fs-extra');
const varname = require('varname');
const norseConfig = require('../norse-config');
const cwd = process.cwd();

const pluginRegistryTemplate = fs.readFileSync(
  `${cwd}/.norse/injectables/PluginRegistry.ts`,
  'utf-8'
);

let paths = ``;
let functions = ``;

// load all plugins from norse config
for (const plugin of norseConfig.plugins) {
  const nodeModuleExists = plugin.startsWith('norse-plugin-')
    ? fs.pathExistsSync(`node_modules/${plugin}`, {
        cwd: cwd,
      })
    : false;

  if (nodeModuleExists) {
    // do something with node module

    paths += `
import { init as ${varname.camelback(
      plugin
    )} } from '${cwd}/node_modules/${plugin}';`;

    functions += `${varname.camelback(plugin)}(this.app);
`;

    continue;
  }

  const localPluginExists = fs.pathExistsSync(`plugins/${plugin}`, {
    cwd: cwd,
  });

  if (localPluginExists) {
    // do something with local plugin

    paths += `
import { init as ${varname.camelback(
      plugin
    )} } from '${cwd}/plugins/${plugin}';`;
    functions += `${varname.camelback(plugin)}(this.app);
`;

    continue;
  }
}

let newFile = pluginRegistryTemplate.replace('/** IMPORTS_ZONE */', paths);
newFile = newFile.replace('/** INIT_ZONE */', functions);

fs.ensureFileSync(`${cwd}/tmp/PluginRegistry.ts`);
fs.writeFileSync(`${cwd}/tmp/PluginRegistry.ts`, newFile);
