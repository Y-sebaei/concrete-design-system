import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import {
  Field,
  controlShell,
  controlSizes,
  controlStates,
  type ControlSize,
  type FieldOwnProps,
} from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className' | 'children'>,
    FieldOwnProps {
  size?: ControlSize;
  options: SelectOption[];
  /** Rendered as a disabled first option. Use for "Any city", not for "Select". */
  placeholder?: string;
  selectClassName?: string;
}

/*
 * A styled native <select>.
 *
 * WHEN TO USE THIS AND WHEN TO USE COMBOBOX
 *
 * Select is the right answer far more often than it looks. It is a real native
 * control, so it inherits the platform's own picker: a scroll wheel on iOS, a
 * searchable dropdown on Android, keyboard type-ahead everywhere, and correct
 * behaviour in every assistive technology without a line of ARIA. Nothing
 * hand-written matches that, including the Combobox in this library.
 *
 * Reach for Combobox only when the list is long enough that scanning it is the
 * bottleneck, roughly past twenty options, or when the user needs to filter by
 * typing rather than jump by first letter. Everything shorter belongs here.
 *
 * The one thing a native select cannot do is style its own option list, and
 * that is the trade being made. The closed control is fully themed; the open
 * list is the operating system's. In a design system this is usually the right
 * way round, because the open list is where correctness matters most and where
 * custom implementations most often break.
 *
 * TOKENS: --ui-surface-sunken (well), --ui-border-strong, --ui-text,
 * --control-height-*, --radius-md, and the chevron uses currentColor.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    required,
    labelHidden,
    className,
    size = 'md',
    options,
    placeholder,
    selectClassName,
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
          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              controlShell,
              controlSizes[size],
              'cui-focus appearance-none pr-9',
              disabled
                ? controlStates.disabled
                : invalid
                  ? controlStates.invalid
                  : controlStates.idle,
              selectClassName,
            )}
            {...rest}
          >
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 12 12"
            width="12"
            height="12"
            className="pointer-events-none absolute right-3 text-text-muted"
          >
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </Field>
  );
});
