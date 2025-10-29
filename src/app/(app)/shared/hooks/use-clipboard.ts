'use client';

import { useCallback, useState } from 'react';

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
        console.error(err.message);
      }
    },
    [config.timeout],
  );

  return {
    copied,
    copy,
  };
}
