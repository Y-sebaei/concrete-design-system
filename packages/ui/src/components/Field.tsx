import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldOwnProps {
  label: ReactNode;
  /** Persistent helper text. Shown whether or not the field is in error. */
  hint?: ReactNode;
  /** When set, the field is invalid and this replaces nothing: both are read. */
  error?: ReactNode;
  required?: boolean;
  /** Hides the label visually and leaves it for assistive technology. */
  labelHidden?: boolean;
  className?: string;
}

export interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

/*
 * The shared label, hint and error scaffolding behind Input, Select and
 * Combobox. Not exported from the package index; it is an implementation
 * detail, and a consumer wanting this shape should use the fields themselves.
 *
 * TOKENS: --ui-text (label), --ui-text-subtle (hint), --ui-danger-text (error),
 * --text-dense, --spacing-1.5.
 *
 * TWO DECISIONS WORTH THE WORDS
 *
 * 1. The hint is not replaced by the error. Most field components swap one for
 *    the other, which throws away the instruction at the exact moment the user
 *    has demonstrated they need it. Both are rendered and both are joined into
 *    aria-describedby, error first, so a screen reader hears what went wrong
 *    before it hears the rule.
 *
 * 2. The required marker is an asterisk with aria-hidden, and the input itself
 *    carries `required`. The asterisk is a visual convention that means nothing
 *    to a screen reader, and reading "asterisk" after every label is worse than
 *    silence. The real signal is the attribute.
 */
export function Field({
  label,
  hint,
  error,
  required,
  labelHidden,
  className,
  children,
}: FieldOwnProps & { children: (props: FieldRenderProps) => ReactNode }) {
  const base = useId();
  const id = `${base}-control`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('font-ui text-dense font-medium text-text', labelHidden && 'sr-only')}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger-text">
            *
          </span>
        ) : null}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} className="font-ui text-dense text-danger-text">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="font-ui text-dense text-text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The shared shell styling for a text-entry control.
 *
 * The well is `surface-sunken`, one tone below the page, which is the whole
 * elevation idea applied downward: an input is a place where content goes in,
 * so it is recessed rather than raised. No inset shadow is used to sell that,
 * because Concrete has no shadows in light mode.
 */
export const controlShell = [
  'w-full rounded-md border bg-surface-sunken text-text',
  'font-ui text-body',
  'transition-colors duration-instant ease-standard',
  'placeholder:text-text-muted',
].join(' ');

export const controlStates = {
  idle: 'border-border-strong hover:border-text-subtle',
  invalid: 'border-danger',
  disabled: 'cursor-not-allowed border-border bg-surface-app text-text-disabled',
} as const;

export const controlSizes = {
  sm: 'h-[var(--control-height-sm)] px-[var(--control-padding-sm)] text-dense',
  md: 'h-[var(--control-height-md)] px-[var(--control-padding-md)]',
  lg: 'h-[var(--control-height-lg)] px-[var(--control-padding-lg)]',
} as const;

export type ControlSize = keyof typeof controlSizes;
