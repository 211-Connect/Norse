'use client';

import { useContext } from 'react';
import { authContext } from '../context/auth-context';

export function useAuth() {
  return useContext(authContext);
}
