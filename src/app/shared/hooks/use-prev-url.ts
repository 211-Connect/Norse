'use client';

import { useContext } from 'react';
import { prevUrlContext } from '../context/prev-url-context';

export function usePrevUrl() {
  const ctx = useContext(prevUrlContext);
  return ctx;
}
