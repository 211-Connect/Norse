import { useCallback, useMemo, useState } from 'react';

export type CollapsibleSet = {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expandAll: () => void;
  collapseAll: (ids: string[]) => void;
};

/**
 * Tracks expand/collapse UI state for a set of items keyed by id.
 *
 * Items are expanded by default: only ids explicitly collapsed are stored,
 * so newly added items (e.g. a section/source created after a "collapse all")
 * start out expanded without any extra bookkeeping.
 */
export function useCollapsibleSet(): CollapsibleSet {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const isExpanded = useCallback(
    (id: string) => !collapsedIds.has(id),
    [collapsedIds],
  );

  const toggle = useCallback((id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  const collapseAll = useCallback((ids: string[]) => {
    setCollapsedIds(new Set(ids));
  }, []);

  return useMemo(
    () => ({ isExpanded, toggle, expandAll, collapseAll }),
    [isExpanded, toggle, expandAll, collapseAll],
  );
}
