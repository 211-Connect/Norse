'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

interface SignInTriggerProps {
  callbackUrl: string;
}

export function SignInTrigger({ callbackUrl }: SignInTriggerProps) {
  useEffect(() => {
    signIn('keycloak', { callbackUrl });
  }, [callbackUrl]);

  return null;
}
