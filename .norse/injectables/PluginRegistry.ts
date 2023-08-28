// @ts-nocheck
/** IMPORTS_ZONE */

export type App = {
  filter: (filterName: string, component: JSX.Element | null) => void;
  getFilter: (filterName: string, fallback?: JSX.Element) => JSX.Element;
};

class PluginRegistry {
  filters: { [key: string]: JSX.Element | null } = {};

  app: App = {
    filter: (name, component) => {
      this.filters[name] = component;
    },
    getFilter: (name, fallback) => {
      return this.filters[name] || fallback;
    },
  };

  init() {
    /** INIT_ZONE */
  }
}

const registry = new PluginRegistry();

export default registry;
