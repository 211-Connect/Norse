'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { signOut } from 'next-auth/react';

type AuthErrorActionsProps = {
  keycloakLogoutPath: string;
  tryAgainLabel: string;
};

export function AuthErrorActions({
  keycloakLogoutPath,
  tryAgainLabel,
}: AuthErrorActionsProps) {
  const handleTryAgain = async () => {
    try {
      await signOut({ redirect: false });
    } finally {
      window.location.assign(keycloakLogoutPath);
    }
  };

  return (
    <Button className="w-full" onClick={handleTryAgain}>
      {tryAgainLabel}
    </Button>
  );
}
