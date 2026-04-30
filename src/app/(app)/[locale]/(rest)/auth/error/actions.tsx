'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/app/(app)/shared/components/ui/button';

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
