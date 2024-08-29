import { useContext } from 'react';
import { Flags, flagsContext } from '../context/flags-context';

export function useFlag(flag: keyof Flags) {
  const flags = useContext(flagsContext);
  const isFlagEnabled = flags[flag];

  return isFlagEnabled;
}
