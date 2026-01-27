import { render, RenderOptions } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { ReactElement } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAtomValues?: Map<any, any>;
}

function AllTheProviders({ children, initialAtomValues }: any) {
  const store = createStore();
  
  // Set initial values if provided
  if (initialAtomValues) {
    initialAtomValues.forEach((value, atom) => {
      store.set(atom, value);
    });
  }
  
  return (
    <JotaiProvider store={store}>
      {children}
    </JotaiProvider>
  );
}

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - React component to render
 * @param options - Render options including initial Jotai atom values
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders initialAtomValues={options?.initialAtomValues} {...props} />
    ),
    ...options,
  });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
