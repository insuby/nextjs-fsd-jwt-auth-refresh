'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { RoutesPath } from 'shared/config';
import { Button, LogInIcon } from 'shared/ui';

import { loginAction } from '../api/login-action';
import { type LoginInput, loginSchema } from '../model/login-schema';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
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

  const fieldClass =
    'h-11 w-full rounded-field border border-line-strong bg-bg text-[0.9375rem] text-ink ' +
    'placeholder:text-muted transition-[border-color,box-shadow] duration-150 outline-none ' +
    'focus:border-brand focus:ring-4 focus:ring-brand/15 ' +
    'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Username</span>
        <input
          {...register('username')}
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          className={`${fieldClass} px-3.5`}
        />
        {errors.username && (
          <span className="text-sm text-danger">{errors.username.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Password</span>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className={`${fieldClass} pr-11 pl-3.5`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-field text-muted transition-colors outline-none hover:text-ink focus-visible:text-ink"
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                className="size-[1.15rem]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 3 18 18" />
                <path d="M10.6 6.1A9.5 9.5 0 0 1 12 6c6 0 9.5 6 9.5 6a16.7 16.7 0 0 1-3.1 3.8M6.3 7.4A16.5 16.5 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 3.8-.8" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-[1.15rem]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <span className="text-sm text-danger">{errors.password.message}</span>
        )}
      </label>

      <Button
        type="submit"
        isLoading={isPending}
        icon={<LogInIcon />}
        className="mt-1 w-full"
      >
        Sign in
      </Button>
    </form>
  );
}
