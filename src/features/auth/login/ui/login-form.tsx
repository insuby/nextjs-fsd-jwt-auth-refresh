'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { RoutesPath } from 'shared/config';
import { Button } from 'shared/ui';

import { loginAction } from '../api/login-action';
import { type LoginInput, loginSchema } from '../model/login-schema';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: 'emilys', password: 'emilyspass' },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        router.replace(RoutesPath.DASHBOARD);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Username</span>
        <input
          {...register('username')}
          autoComplete="username"
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.username && (
          <span className="text-sm text-red-600">
            {errors.username.message}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.password && (
          <span className="text-sm text-red-600">
            {errors.password.message}
          </span>
        )}
      </label>

      <Button type="submit" isLoading={isPending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
