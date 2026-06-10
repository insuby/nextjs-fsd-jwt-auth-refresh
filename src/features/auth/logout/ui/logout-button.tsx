'use client';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { useTransition } from 'react';

import { RoutesPath } from 'shared/config';
import { Button } from 'shared/ui';

import { logoutAction } from '../api/logout-action';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const onLogout = () =>
    startTransition(async () => {
      await logoutAction();
      queryClient.clear();
      router.replace(RoutesPath.LOGIN);
      router.refresh();
    });

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onLogout}
      isLoading={isPending}
    >
      Log out
    </Button>
  );
}
