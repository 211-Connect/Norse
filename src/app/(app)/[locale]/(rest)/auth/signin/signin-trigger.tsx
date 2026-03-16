'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

interface SignInTriggerProps {
  callbackUrl: string;
}

export function SignInTrigger({ callbackUrl }: SignInTriggerProps) {
  useEffect(() => {
    signIn('keycloak', { callbackUrl });
  }, [callbackUrl]);

  return null;
}
