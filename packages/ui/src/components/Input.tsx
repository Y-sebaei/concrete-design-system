import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  Field,
  controlShell,
  controlSizes,
  controlStates,
  type ControlSize,
  type FieldOwnProps,
} from './Field';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>, FieldOwnProps {
  size?: ControlSize;
  /** Rendered inside the well, before the text. Decorative. */
  iconStart?: ReactNode;
  /** Rendered inside the well, after the text. Decorative. */
  iconEnd?: ReactNode;
  /** Applied to the input element, not the wrapper. */
  inputClassName?: string;
  /**
   * Right-aligns the value and forces tabular figures. For money, counts and
   * anything else that will sit in a column.
   */
  numeric?: boolean;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   well        --ui-surface-sunken
 *   text        --ui-text, --ui-text-muted (placeholder)
 *   boundary    --ui-border-strong, --ui-danger (invalid), --ui-border (inert)
 *   geometry    --control-height-*, --control-padding-*, --radius-md
 *   type        --text-body, --text-dense
 *   focus       .cui-focus
 *
 * The placeholder is --ui-text-muted, not --ui-text-subtle. Placeholder text is
 * in the contrast contract at 4.5:1 against the sunken surface, and subtle does
 * not clear it there. Browsers ship placeholders at around 2:1 by default,
 * which is the most commonly shipped contrast failure on the web.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    required,
    labelHidden,
    className,
    size = 'md',
    iconStart,
    iconEnd,
    inputClassName,
    numeric = false,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      labelHidden={labelHidden}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div className="relative flex items-center">
          {iconStart ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 flex text-text-muted"
            >
              {iconStart}
            </span>
          ) : null}

          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              controlShell,
              controlSizes[size],
              'cui-focus',
              disabled
                ? controlStates.disabled
                : invalid
                  ? controlStates.invalid
                  : controlStates.idle,
              iconStart && 'pl-9',
              iconEnd && 'pr-9',
              numeric && 'cui-tnum text-right',
              inputClassName,
            )}
            {...rest}
          />

          {iconEnd ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 flex text-text-muted"
            >
              {iconEnd}
            </span>
          ) : null}
        </div>
      )}
    </Field>
  );
});
