'use client';

import { createLogger } from '@/lib/logger';
import { useCallback, useState } from 'react';

const log = createLogger('use-clipboard');

type UseClipboardConfig = {
  timeout?: number;
};

export function useClipboard(config: UseClipboardConfig = { timeout: 3000 }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (valueToCopy) => {
      try {
        await navigator.clipboard.writeText(valueToCopy);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, config.timeout);
      } catch (err) {
        log.error({ err }, 'Failed to copy to clipboard');
      }
    },
    [config.timeout],
  );

  return {
    copied,
    copy,
  };
}
