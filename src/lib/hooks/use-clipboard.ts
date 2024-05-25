import { useEffect, useRef, useState } from 'react';

export default function useClipboard({ timeout = 300 }: { timeout?: number }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const copy = async (valueToCopy: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(valueToCopy);
        setCopied(true);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    clearTimeout(timeoutRef?.current);
    if (copied) {
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, timeout);
    }
  }, [timeout, copied]);

  return { copied, copy, error };
}
