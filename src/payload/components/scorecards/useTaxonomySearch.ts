import { useEffect, useMemo, useReducer } from 'react';

import { getErrorMessage } from '@/app/(app)/shared/lib/getErrorMessage';
import { useDebounce } from '@/app/(app)/shared/hooks/use-debounce';
import { TaxonomySearchItem } from '@/types/taxonomyScorecard';

import { searchTaxonomyItems } from './api';
import { ManagerError } from './types';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

type SearchState = {
  status: SearchStatus;
  items: TaxonomySearchItem[];
  error: ManagerError | null;
};

type SearchAction =
  | { type: 'reset' }
  | { type: 'loading' }
  | { type: 'success'; items: TaxonomySearchItem[] }
  | { type: 'error'; message: string };

const initialState: SearchState = {
  status: 'idle',
  items: [],
  error: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'loading':
      return {
        ...state,
        status: 'loading',
        error: null,
      };
    case 'success':
      return {
        status: 'success',
        items: action.items,
        error: null,
      };
    case 'error':
      return {
        status: 'error',
        items: [],
        error: { message: action.message },
      };
    default:
      return state;
  }
}

export function useTaxonomySearch(tenantId: string | null, query: string) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebounce(normalizedQuery, 1_000);

  useEffect(() => {
    if (!tenantId || !debouncedQuery) {
      dispatch({ type: 'reset' });
      return;
    }

    const controller = new AbortController();

    const search = async () => {
      dispatch({ type: 'loading' });

      try {
        const items = await searchTaxonomyItems(tenantId, debouncedQuery, {
          signal: controller.signal,
        });

        dispatch({ type: 'success', items });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        dispatch({ type: 'error', message: getErrorMessage(error) });
      }
    };

    search();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, tenantId]);

  return {
    items: state.items,
    error: state.error,
    loading: state.status === 'loading',
  };
}
