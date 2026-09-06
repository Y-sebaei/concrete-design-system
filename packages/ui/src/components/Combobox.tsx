import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { Field, controlShell, controlSizes, controlStates, type ControlSize, type FieldOwnProps } from './Field';
import { Spinner } from './Spinner';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Rendered under the label inside the option. Not part of the filter. */
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps extends FieldOwnProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /**
   * Controlled query text. Provide together with `onInputChange` when the
   * options are fetched from a server; leave both out for local filtering.
   */
  inputValue?: string;
  onInputChange?: (query: string) => void;
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  /**
   * `list` filters the listbox as you type, and is the default.
   * `both` also completes the first match inline in the text field and selects
   * the completed part, so continuing to type replaces it. Use `both` only when
   * the option labels have distinct prefixes: on a list where many entries
   * start with the same words it fights the user on every keystroke.
   */
  autocomplete?: 'list' | 'both';
  /** Shown in the listbox while an async search is in flight. */
  loading?: boolean;
  /** Replaces the built-in "No matches" copy. Write something specific. */
  emptyMessage?: ReactNode;
  /** Renders a clear button once there is a value. */
  clearable?: boolean;
  /** Maximum listbox height before it scrolls. */
  maxListHeight?: number;
}

function defaultFilter(options: ComboboxOption[], query: string): ComboboxOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q),
  );
}

/*
 * An editable combobox with list autocomplete, per the ARIA Authoring Practices
 * "Combobox" pattern. Written by hand rather than wrapped, because the pattern
 * is the point.
 *
 * THE SHAPE, AND WHY IT IS THIS SHAPE
 *
 *   <input role="combobox" aria-expanded aria-controls aria-activedescendant>
 *   <ul role="listbox" aria-labelledby={the field label}>
 *     <li role="option" aria-selected>
 *
 * role="combobox" goes on the input itself, not on a wrapper. That changed in
 * ARIA 1.2 and is the single most common thing to get wrong when copying an
 * older example: a wrapper with role="combobox" containing a text input
 * produces a control that NVDA and JAWS both describe incorrectly.
 *
 * DOM FOCUS NEVER LEAVES THE INPUT
 *
 * Arrow keys move `aria-activedescendant` to an option's id. They do not move
 * focus. This is what lets the user keep typing while an option is highlighted,
 * and it is why the highlighted option is styled through a data attribute
 * rather than through :focus. Two consequences that are easy to miss:
 *
 *   - The active option has to be scrolled into view manually, because the
 *     browser only does that for real focus.
 *   - The highlight has to be visible without being a focus ring, since the
 *     actual focus ring is on the input where it belongs.
 *
 * ANNOUNCEMENTS
 *
 * Screen readers announce the active option automatically from
 * aria-activedescendant. What they do not announce is how many options the
 * filter left, so the result count goes into a polite live region. It is
 * debounced by one animation frame and only speaks when the count changes,
 * because a region that fires on every keystroke reads the count over the
 * letter the user just typed.
 *
 * TOKENS THIS COMPONENT READS
 *
 *   well      --ui-surface-sunken (input), --ui-surface-overlay (listbox)
 *   active    --ui-accent-bg, --ui-accent-text
 *   selected  --ui-accent-text and a check mark
 *   boundary  --ui-border-strong (input), --ui-border (listbox)
 *   geometry  --radius-md (input), --radius-lg (listbox), --control-height-*
 *   shadow    --ui-shadow-popover, none in light mode
 *   motion    --duration-medium, --ease-enter, cui-lift-in
 */
export function Combobox({
  label,
  hint,
  error,
  required,
  labelHidden,
  className,
  options,
  value,
  onChange,
  inputValue,
  onInputChange,
  placeholder,
  size = 'md',
  disabled = false,
  autocomplete = 'list',
  loading = false,
  emptyMessage,
  clearable = true,
  maxListHeight = 288,
}: ComboboxProps) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const announcedRef = useRef<string>('');
  /** The last value this component wrote into the field, for the fallback below. */
  const lastWrittenRef = useRef<string>('');

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  /*
   * Uncontrolled query state, used only when the caller has not supplied
   * `inputValue`. Keeping both paths in one component avoids shipping two
   * comboboxes, and the console needs the controlled one for server-side order
   * search while every local filter wants the simple one.
   */
  const [internalQuery, setInternalQuery] = useState('');
  const controlled = inputValue !== undefined;
  const query = controlled ? inputValue : internalQuery;

  const setQuery = useCallback(
    (next: string) => {
      if (!controlled) setInternalQuery(next);
      onInputChange?.(next);
    },
    [controlled, onInputChange],
  );

  /*
   * When the options come from a server the caller has already filtered them,
   * and filtering again locally would hide results whose match was on a field
   * the server searched and this component cannot see.
   */
  const visible = useMemo(
    () => (onInputChange ? options : defaultFilter(options, query)),
    [onInputChange, options, query],
  );

  /* Keep the text field showing the selected label while the popup is closed. */
  useEffect(() => {
    if (open) return;
    setQuery(selected?.label ?? '');
    // Only when the selection or the open state changes: including setQuery
    // would re-run this on every parent render and fight the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, open]);

  /* Scroll the active option into view. aria-activedescendant does not. */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`);
    node?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  /* The result count, announced politely and only when it changes. */
  useEffect(() => {
    if (!open) {
      announcedRef.current = '';
      setAnnouncement('');
      return;
    }

    const message = loading
      ? 'Searching'
      : visible.length === 0
        ? 'No results'
        : `${visible.length} result${visible.length === 1 ? '' : 's'} available`;

    if (message === announcedRef.current) return;
    announcedRef.current = message;

    const frame = requestAnimationFrame(() => setAnnouncement(message));
    return () => cancelAnimationFrame(frame);
  }, [open, loading, visible.length]);

  const openList = useCallback((index: number) => {
    setOpen(true);
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const commit = useCallback(
    (option: ComboboxOption | undefined) => {
      if (!option || option.disabled) return;
      onChange(option.value);
      setQuery(option.label);
      close();
    },
    [close, onChange, setQuery],
  );

  const indexOfFirstEnabled = () => visible.findIndex((option) => !option.disabled);
  const indexOfLastEnabled = () => {
    for (let i = visible.length - 1; i >= 0; i -= 1) if (!visible[i]!.disabled) return i;
    return -1;
  };

  /** Walks past disabled options rather than landing on one. */
  const step = (from: number, direction: 1 | -1): number => {
    if (visible.length === 0) return -1;
    let next = from;
    for (let guard = 0; guard < visible.length; guard += 1) {
      next += direction;
      if (next >= visible.length) next = 0;
      if (next < 0) next = visible.length - 1;
      if (!visible[next]!.disabled) return next;
    }
    return -1;
  };

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!open) {
          // Alt+Down opens without moving the highlight, which is the APG
          // behaviour and the one blind users expect: it says "show me the
          // list" rather than "choose something".
          openList(event.altKey ? -1 : indexOfFirstEnabled());
        } else {
          setActiveIndex((current) => step(current, 1));
        }
        return;
      }

      case 'ArrowUp': {
        event.preventDefault();
        if (event.altKey) {
          // Alt+Up commits the highlight and closes.
          if (open && activeIndex >= 0) commit(visible[activeIndex]);
          else close();
          return;
        }
        if (!open) openList(indexOfLastEnabled());
        else setActiveIndex((current) => step(current, -1));
        return;
      }

      case 'Enter': {
        if (open && activeIndex >= 0) {
          // Only swallowed when it is doing something. An Enter that falls
          // through submits the surrounding form, which is correct.
          event.preventDefault();
          commit(visible[activeIndex]);
        }
        return;
      }

      case 'Escape': {
        event.preventDefault();
        if (open) {
          close();
        } else {
          // APG: a second Escape clears the field. Worth having, because the
          // alternative is holding Backspace.
          setQuery('');
          onChange(null);
        }
        return;
      }

      case 'Tab': {
        // Not prevented. Tab commits whatever is highlighted and then moves on,
        // which is what makes the control usable in a form without trapping
        // anyone inside it.
        if (open && activeIndex >= 0) commit(visible[activeIndex]);
        else close();
        return;
      }

      case 'Home':
      case 'End': {
        // Deliberately not handled. This is an editable combobox, so Home and
        // End belong to the text caret. Hijacking them to jump to the first or
        // last option breaks text editing for a shortcut nobody asked for.
        return;
      }

      case 'PageDown': {
        if (!open) return;
        event.preventDefault();
        setActiveIndex((current) => Math.min(visible.length - 1, Math.max(0, current) + 10));
        return;
      }

      case 'PageUp': {
        if (!open) return;
        event.preventDefault();
        setActiveIndex((current) => Math.max(0, Math.max(0, current) - 10));
        return;
      }

      default:
        return;
    }
  }

  function onInput(event: React.ChangeEvent<HTMLInputElement>) {
    const element = event.target;
    const next = element.value;
    setQuery(next);
    setOpen(true);
    const previouslyWritten = lastWrittenRef.current;
    lastWrittenRef.current = next;

    if (autocomplete === 'both' && next.length > 0) {
      /*
       * Inline autocomplete.
       *
       * TWO THINGS HERE ARE NOT OBVIOUS, AND BOTH ARE BUGS THIS COMPONENT HAD.
       *
       * 1. Deletion must not complete.
       *
       *    Backspace over a selected completion leaves "brem" with the caret at
       *    position 4, which is indistinguishable from having just typed "brem"
       *    if you only look at the caret. Completing again puts "Bremen" back
       *    instantly, and the field appears frozen: the user presses Backspace
       *    repeatedly and nothing happens. inputType is the precise signal, and
       *    the length comparison covers environments that do not set it.
       *
       * 2. The completed value is written to the DOM directly as well as to
       *    state.
       *
       *    The state write alone is not enough. After the first completion the
       *    state is already "Bremen", so the next keystroke sets it to "Bremen"
       *    again, React sees an unchanged value, and skips the render. No render
       *    means no effect, which means the caret is never placed and the
       *    selection the completion depends on never exists. Writing the element
       *    directly makes the correction independent of whether React decides a
       *    render is warranted, and the following setQuery keeps state in step.
       */
      const inputType = (event.nativeEvent as InputEvent).inputType ?? '';
      const isDeleting = inputType
        ? inputType.startsWith('delete')
        : // Fallback for anything that does not report inputType. Comparing
          // against the previous state length does not work: typing over a
          // selected completion legitimately shortens the value, so "br"
          // replacing "Berlin" would look like a deletion. Comparing against
          // the last value this component wrote does work, because a deletion
          // leaves a case-insensitive prefix of it and a replacement does not.
          next.length < previouslyWritten.length &&
          previouslyWritten.toLowerCase().startsWith(next.toLowerCase());

      const isAppending = element.selectionStart === next.length;

      const match = options.find(
        (option) => !option.disabled && option.label.toLowerCase().startsWith(next.toLowerCase()),
      );

      if (!isDeleting && isAppending && match && match.label.length > next.length) {
        element.value = match.label;
        element.setSelectionRange(next.length, match.label.length);
        lastWrittenRef.current = match.label;
        setQuery(match.label);
        setActiveIndex(visible.findIndex((option) => option.value === match.value));
        return;
      }
    }

    setActiveIndex(indexOfFirstEnabled());
  }

  const activeDescendant = open && activeIndex >= 0 ? optionId(activeIndex) : undefined;

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
        <div
          className="relative"
          onBlur={(event) => {
            // Closing on blur has to ignore focus moving between the input and
            // its own listbox, which relatedTarget makes cheap to detect.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
          }}
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id={id}
              type="text"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              value={query}
              onChange={onInput}
              onKeyDown={onKeyDown}
              onMouseDown={() => {
                // Opening by pointer highlights whatever is already selected,
                // and highlights nothing when there is no selection. Landing on
                // the first option instead would mean a click followed by Enter
                // silently picks an option the user never looked at.
                if (disabled || open) return;
                openList(value ? visible.findIndex((option) => option.value === value) : -1);
              }}
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete={autocomplete}
              aria-activedescendant={activeDescendant}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={cn(
                controlShell,
                controlSizes[size],
                'cui-focus pr-16',
                disabled
                  ? controlStates.disabled
                  : invalid
                    ? controlStates.invalid
                    : controlStates.idle,
              )}
            />

            <div className="pointer-events-none absolute right-2 flex items-center gap-1">
              {loading ? <Spinner size={14} className="text-text-muted" /> : null}

              {clearable && value && !disabled ? (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Clear ${typeof label === 'string' ? label.toLowerCase() : 'selection'}`}
                  onClick={() => {
                    onChange(null);
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="pointer-events-auto rounded-sm p-1 text-text-muted transition-colors duration-instant hover:bg-surface-app hover:text-text"
                >
                  <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
                    <path
                      d="m3 3 6 6m0-6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : null}

              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                width="12"
                height="12"
                className={cn(
                  'text-text-muted transition-transform duration-fast ease-standard',
                  open && 'rotate-180',
                )}
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
          </div>

          {/*
            The listbox stays in the DOM only while open. An always-present
            listbox with hidden options is a common shortcut and it makes
            aria-controls point at something a screen reader can reach and find
            empty, which is worse than it not being there.
          */}
          {open ? (
            /*
              The popup is a div; the listbox is the ul inside it.
              
              Splitting them matters for the empty case. A role="listbox" may
              only contain options, so putting a "nothing matched" <li> inside
              the ul breaks two axe rules at once: aria-required-children,
              because li is not an allowed child of listbox, and listitem,
              because the li's parent no longer has an implicit list role. The
              empty message therefore lives beside the listbox rather than in
              it, the listbox is simply empty, and aria-controls still points at
              something real.
            */
            <div
              style={{ maxHeight: maxListHeight }}
              className={cn(
                'absolute z-40 mt-1 w-full overflow-y-auto',
                'rounded-lg border border-border bg-surface-overlay shadow-popover',
                '[--ui-focus-ring-offset:var(--ui-surface-overlay)]',
                'motion-safe:animate-[cui-lift-in_var(--duration-medium)_var(--ease-enter)]',
              )}
            >
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label={typeof label === 'string' ? label : undefined}
                className={cn(visible.length > 0 && 'py-1')}
              >
                {visible.map((option, index) => {
                  const isActive = index === activeIndex;
                  const isSelected = option.value === value;

                  return (
                    <li
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      // mousedown, not click: click fires after blur, and blur
                      // has already closed the list by then.
                      onMouseDown={(event) => {
                        event.preventDefault();
                        commit(option);
                      }}
                      onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                      className={cn(
                        'flex cursor-pointer items-start gap-2 px-3 py-2',
                        'font-ui text-body',
                        'transition-colors duration-instant ease-standard',
                        option.disabled && 'cursor-not-allowed text-text-disabled',
                        // cui-option-active carries the tint, the text colour
                        // and the accent bar together. See base.css for why the
                        // bar is not optional.
                        !option.disabled && isActive && 'cui-option-active',
                        !option.disabled && !isActive && 'text-text',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 shrink-0',
                          isSelected ? 'text-accent-text' : 'text-transparent',
                        )}
                      >
                        <svg viewBox="0 0 12 12" width="12" height="12">
                          <path
                            d="m2.5 6.5 2.5 2.5 4.5-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {option.description ? (
                          <span
                            className={cn(
                              'block truncate font-ui text-dense',
                              isActive ? 'text-accent-text' : 'text-text-subtle',
                            )}
                          >
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {visible.length === 0 ? (
                /*
                  Not an option, and not focusable. An empty state offered as a
                  selectable option is a dead end: the user arrows onto it,
                  presses Enter, and nothing happens. What carries this to a
                  screen reader is the count in the live region below.
                */
                <div className="px-3 py-6 text-center">
                  <p className="font-ui text-dense text-text">
                    {emptyMessage ?? (loading ? 'Searching' : 'Nothing matches that')}
                  </p>
                  {!loading && !emptyMessage ? (
                    <p className="mt-1 font-ui text-dense text-text-subtle">
                      Try fewer characters, or check the spelling.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/*
            The result count. aria-live rather than role="status" so the
            container is present from first render: a live region added to the
            DOM at the same moment as its content is not reliably announced,
            which is the usual reason a count that looks correct is silent.
          */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </div>
        </div>
      )}
    </Field>
  );
}
