import dynamic from 'next/dynamic';
import React, {
  Component,
  ComponentType,
  ErrorInfo,
  PropsWithChildren,
} from 'react';

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<PropsWithChildren, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

type Props = PropsWithChildren<{
  plugin?: string;
  component?: string;
  page?: string;
  [key: string]: unknown;
}>;

function InternalPluginLoader({ plugin, component, ...rest }: Props) {
  if (!plugin || !component) return null;

  const PluginComponent: ComponentType<Partial<Props>> = dynamic(
    () =>
      import(`../../plugins/${plugin}`).then(
        (mod) => mod.default.components[component]
      ),
    {
      loading: () => <p>Loading...</p>,
    }
  );

  return <PluginComponent {...rest} />;
}

function InternalPluginPageLoader({ plugin, page, ...rest }: Props) {
  if (!page) return null;

  const PluginComponent: ComponentType<Partial<Props>> = dynamic(
    () => import(`./../../plugins/${plugin}/pages/${page}`),
    {
      loading: () => <p>Loading...</p>,
    }
  );

  return <PluginComponent {...rest} />;
}

export function PluginPageLoader(props: Props) {
  return (
    <ErrorBoundary>
      <InternalPluginPageLoader {...props} />
    </ErrorBoundary>
  );
}

export function PluginLoader(props: Props) {
  return (
    <ErrorBoundary>
      <InternalPluginLoader {...props} />
    </ErrorBoundary>
  );
}
