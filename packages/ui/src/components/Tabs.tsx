import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';

export interface TabItem {
  value: string;
  label: ReactNode;
  /** Rendered after the label, for a count. */
  badge?: ReactNode;
  disabled?: boolean;
}

interface TabsContextValue {
  value: string;
  tabId: (value: string) => string;
  panelId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Required. Names the tablist for a screen reader. */
  label: string;
  /**
   * `automatic` selects a tab as soon as it receives focus, which is the ARIA
   * default and correct when switching panels is instant.
   *
   * `manual` requires Enter or Space. Use it when a panel loads data, because
   * automatic activation fires a request for every tab the user arrows past on
   * the way to the one they wanted.
   */
  activation?: 'automatic' | 'manual';
  /** The panels. Render one TabPanel per item. */
  children?: ReactNode;
  className?: string;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   rest      --ui-text-muted, transparent underline
 *   selected  --ui-accent-text, --ui-accent underline
 *   hover     --ui-text, --ui-border-strong underline
 *   geometry  2px underline, --spacing-3 padding, --radius-sm on the hit area
 *   motion    --duration-fast on colour, --duration-medium on the underline
 *
 * WHY AN UNDERLINE AND NOT A FILLED PILL
 *
 * Tabs in this system usually sit directly above a table, and a filled tab puts
 * a second band of colour immediately above the table header, which already has
 * one. An underline puts the emphasis on the boundary between the tab and its
 * panel, which is the relationship the control is actually describing.
 *
 * ROVING TABINDEX
 *
 * Exactly one tab is in the tab order, the selected one, and arrow keys move
 * between them. This is the ARIA tabs pattern, and the reason is worth stating:
 * without it a keyboard user presses Tab once per tab to get past the tablist,
 * so a nine-tab list costs nine keystrokes to reach the content the tabs
 * describe.
 */
export function Tabs({
  items,
  value,
  onChange,
  label,
  activation = 'automatic',
  children,
  className,
}: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const context = useMemo<TabsContextValue>(
    () => ({
      value,
      tabId: (tabValue: string) => `${baseId}-tab-${tabValue}`,
      panelId: (tabValue: string) => `${baseId}-panel-${tabValue}`,
    }),
    [baseId, value],
  );

  const focusTab = useCallback((tabValue: string) => {
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-tab-value="${CSS.escape(tabValue)}"]`)
      ?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;

    const currentIndex = enabled.findIndex((item) => item.value === value);
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % enabled.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = enabled.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = enabled[nextIndex]!;
    focusTab(next.value);
    // Under manual activation the arrows move focus only, and Enter or Space
    // commits through the button's own click handler.
    if (activation === 'automatic') onChange(next.value);
  }

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>
        {/*
          eslint-disable-next-line jsx-a11y/interactive-supports-focus --
          a tablist is not focusable and must not be. The ARIA tabs pattern puts
          exactly one tab in the tab order and moves between them with the arrow
          keys, so the handler is here as a delegate for keys pressed on the
          focused tab inside. Adding tabindex to the tablist would create a stop
          that does nothing, immediately before the tab that does.
        */}
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="flex gap-1 overflow-x-auto border-b border-border"
        >
          {items.map((item) => {
            const selected = item.value === value;

            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                id={context.tabId(item.value)}
                data-tab-value={item.value}
                aria-selected={selected}
                aria-controls={context.panelId(item.value)}
                tabIndex={selected ? 0 : -1}
                disabled={item.disabled}
                onClick={() => !item.disabled && onChange(item.value)}
                className={cn(
                  'cui-focus relative inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2',
                  'font-ui text-body font-medium whitespace-nowrap',
                  'transition-colors duration-fast ease-standard',
                  // The underline is a pseudo-element rather than a border, so
                  // it sits on top of the tablist's own border instead of
                  // adding a second line one pixel below it.
                  'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full',
                  'after:transition-colors after:duration-medium after:ease-standard',
                  item.disabled && 'cursor-not-allowed text-text-disabled after:bg-transparent',
                  !item.disabled && selected && 'text-accent-text after:bg-accent',
                  !item.disabled &&
                    !selected &&
                    'text-text-muted after:bg-transparent hover:text-text hover:after:bg-border-strong',
                )}
              >
                {item.label}
                {item.badge}
              </button>
            );
          })}
        </div>

        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabPanelProps {
  /** Matches the `value` of the tab that controls this panel. */
  value: string;
  children: ReactNode;
  /**
   * Adds tabindex={0} so the panel itself is reachable.
   *
   * Correct when the panel has no focusable content, because otherwise a
   * keyboard user cannot reach or scroll it. Set it false when the panel
   * contains its own controls, where the extra stop lands on a container that
   * does nothing.
   */
  focusable?: boolean;
  className?: string;
}

export function TabPanel({ value, children, focusable = true, className }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('<TabPanel> must be rendered inside <Tabs>.');

  // Unmounted rather than hidden. Keeping every panel mounted means the tables
  // in the panels nobody is looking at keep their subscriptions open, which in
  // this console means live socket rooms for events that are not on screen.
  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      id={context.panelId(value)}
      aria-labelledby={context.tabId(value)}
      tabIndex={focusable ? 0 : undefined}
      className={cn('cui-focus pt-4', className)}
    >
      {children}
    </div>
  );
}
