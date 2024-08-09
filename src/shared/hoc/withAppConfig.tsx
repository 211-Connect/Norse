import React from 'react';
import { appConfigContext } from '../context/app-config-context';

export function withAppConfig<P>(WrappedComponent: React.ComponentType<P>) {
  return class WithAppConfig extends React.Component<P> {
    static contextType = appConfigContext;
    context!: React.ContextType<typeof appConfigContext>;

    render() {
      if (!this.context) {
        throw new Error(
          'withAppConfig must be used within a appConfigContext.Provider'
        );
      }

      // Modify props or add new props here
      const newProps = {
        ...this.props,
        appConfig: this.context,
      };

      return <WrappedComponent {...newProps} />;
    }
  };
}
