import { type App } from '../../.norse/injectables/PluginRegistry';
import ClientComponent from './client-component';

export function init(app: App) {
  app.filter('main-nav', <ClientComponent />);
  app.filter('main-nav', <h3 className="text-primary-200">Hello, world!</h3>);
}
