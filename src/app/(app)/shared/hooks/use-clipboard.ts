'use client';

import { useCallback, useState } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('use-clipboard');

type UseClipboardConfig = {
  timeout?: number;
};

export function useClipboard(config: UseClipboardConfig = { timeout: 500 }) {
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
