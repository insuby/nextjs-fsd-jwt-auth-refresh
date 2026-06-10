import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Spinner } from './spinner';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const BASE =
  'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-field font-medium ' +
  'whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg active:translate-y-px disabled:pointer-events-none disabled:opacity-55';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-deep text-on-brand hover:bg-brand-deep-hover',
  secondary:
    'border border-line-strong bg-bg text-ink hover:border-line hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Leading icon — swapped for a spinner while loading (fixed-size slot). */
  icon?: ReactNode;
  /** Show a spinner in the icon slot and disable the button while loading. */
  isLoading?: boolean;
  variant?: Variant;
  size?: Size;
};

/**
 * Shared button primitive with a built-in loading state.
 * When `icon` is set, it swaps to a spinner in a fixed slot so the label
 * and surrounding layout never jump.
 */
export function Button({
  children,
  icon,
  isLoading = false,
  variant = 'primary',
  size = 'md',
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
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {(icon || isLoading) && (
        <span
          className="grid size-4 shrink-0 place-items-center"
          aria-hidden="true"
        >
          {isLoading ? <Spinner /> : icon}
        </span>
      )}
      {children}
    </button>
  );
}
