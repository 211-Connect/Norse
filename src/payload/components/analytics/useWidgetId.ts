'use client';

import { useEffect, useState } from 'react';

export function useWidgetId(ref: React.RefObject<HTMLElement | null>) {
  const [widgetId, setWidgetId] = useState<string | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const widget = element.closest('.widget');
    const slug = widget?.getAttribute('data-slug');
    if (slug) {
      setWidgetId(slug);
      return;
    }

    const draggable = element.closest('.draggable');
    if (draggable && draggable.id) {
      setWidgetId(draggable.id);
      return;
    }

    setWidgetId(null);
  }, [ref]);

  return widgetId;
}
