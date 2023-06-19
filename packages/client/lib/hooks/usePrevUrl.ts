import { useContext } from 'react';
import { prevUrlContext } from '../context/PrevUrl';

export function usePrevUrl() {
  const ctx = useContext(prevUrlContext);
  return ctx;
}
