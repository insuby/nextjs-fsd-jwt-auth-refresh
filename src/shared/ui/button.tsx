import type { ButtonHTMLAttributes } from 'react';

import { Spinner } from './spinner';

type Variant = 'primary' | 'secondary';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-black text-white hover:bg-gray-800',
  secondary: 'border border-gray-300 bg-white hover:bg-gray-50',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Show a spinner and disable the button while an async action runs. */
  isLoading?: boolean;
  variant?: Variant;
};

/**
 * Shared button primitive with a built-in loading state (spinner + disabled).
 * The label stays put while loading so the layout doesn't jump.
 */
export function Button({
  children,
  isLoading = false,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
