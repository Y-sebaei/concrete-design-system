import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox, type ComboboxOption } from './Combobox';

const cities: ComboboxOption[] = [
  { value: 'berlin', label: 'Berlin', description: 'DE' },
  { value: 'bern', label: 'Bern', description: 'CH' },
  { value: 'bremen', label: 'Bremen', description: 'DE' },
  { value: 'cologne', label: 'Cologne', description: 'DE' },
  { value: 'dresden', label: 'Dresden', description: 'DE', disabled: true },
  { value: 'hamburg', label: 'Hamburg', description: 'DE' },
];

function Harness({
  autocomplete,
  options = cities,
  onChangeSpy,
}: {
  autocomplete?: 'list' | 'both';
  options?: ComboboxOption[];
  onChangeSpy?: (value: string | null) => void;
}) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Combobox
      label="City"
      options={options}
      value={value}
      autocomplete={autocomplete}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
    />
  );
}

const input = () => screen.getByRole('combobox', { name: 'City' });

describe('Combobox, ARIA wiring', () => {
  it('puts role=combobox on the input itself, not on a wrapper', () => {
    render(<Harness />);
    expect(input().tagName).toBe('INPUT');
  });

  it('starts collapsed and points aria-controls at the listbox', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(input()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(input());

    expect(input()).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input().getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('declares its autocomplete behaviour', async () => {
    const user = userEvent.setup();
    render(<Harness autocomplete="both" />);
    await user.click(input());
    expect(input()).toHaveAttribute('aria-autocomplete', 'both');
  });

  it('keeps DOM focus on the input and tracks the option with aria-activedescendant', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(input());
    // Opening by pointer highlights nothing, so the first ArrowDown lands on
    // the first option rather than the second.
    await user.keyboard('{ArrowDown}');

    expect(input()).toHaveFocus();

    const activeId = input().getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)).toHaveTextContent('Berlin');
  });

  it('marks only the chosen option aria-selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(input());
    await user.keyboard('{ArrowDown}{Enter}');
    await user.click(input());

    const selected = screen
      .getAllByRole('option')
      .filter((option) => option.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Berlin');
  });
});

describe('Combobox, keyboard', () => {
  it('opens on ArrowDown and highlights the first option', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('Berlin');
  });

  it('opens on ArrowUp and highlights the last option', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    await user.keyboard('{ArrowUp}');

    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('Hamburg');
  });

  it('opens on Alt+ArrowDown without moving the highlight', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-activedescendant');
  });

  it('steps over disabled options instead of landing on them', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    // Berlin, Bern, Bremen, Cologne, then Dresden is disabled so Hamburg.
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('Cologne');

    await user.keyboard('{ArrowDown}');
    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('Hamburg');
  });

  it('wraps from the last option to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    await user.keyboard('{ArrowUp}{ArrowDown}');
    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('Berlin');
  });

  it('commits the highlighted option on Enter and closes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChangeSpy={onChange} />);

    input().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('bern');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).toHaveValue('Bern');
  });

  it('closes on the first Escape and clears on the second', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChangeSpy={onChange} />);

    input().focus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input()).toHaveValue('Berlin');

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).toHaveValue('Berlin');

    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('commits on Tab and lets focus leave', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Harness onChangeSpy={onChange} />
        <button type="button">After</button>
      </>,
    );

    input().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith('bern');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('leaves Home and End to the text caret', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    input().focus();
    await user.keyboard('{ArrowDown}');
    const before = input().getAttribute('aria-activedescendant');

    await user.keyboard('{End}');
    expect(input().getAttribute('aria-activedescendant')).toBe(before);
  });
});

describe('Combobox, filtering and announcements', () => {
  it('filters as you type', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(input());
    await user.type(input(), 'bre');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Bremen');
  });

  it('announces the result count politely', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(input());
    await user.type(input(), 'bre');

    const live = container.querySelector('[aria-live="polite"]');
    await waitFor(() => expect(live).toHaveTextContent('1 result available'));
  });

  it('announces no results and offers a real empty state', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(input());
    await user.type(input(), 'zzzz');

    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('No results'),
    );

    // The empty message must not be reachable as an option: arrowing onto it
    // and pressing Enter would do nothing.
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Nothing matches that')).toBeInTheDocument();
  });

  it('does not re-filter server-supplied options', async () => {
    const user = userEvent.setup();

    function ServerHarness() {
      const [query, setQuery] = useState('');
      const [value, setValue] = useState<string | null>(null);
      // The "server" matched on a field this component cannot see.
      const results: ComboboxOption[] =
        query.length > 0
          ? [{ value: 'ord-1', label: 'Order 4d1f', description: 'ada@example.com' }]
          : [];

      return (
        <Combobox
          label="Order"
          options={results}
          value={value}
          onChange={setValue}
          inputValue={query}
          onInputChange={setQuery}
        />
      );
    }

    render(<ServerHarness />);
    const field = screen.getByRole('combobox', { name: 'Order' });
    await user.click(field);
    await user.type(field, 'ada');

    // "ada" matches neither the label nor the value, so local filtering would
    // have hidden this result.
    expect(within(screen.getByRole('listbox')).getByText('Order 4d1f')).toBeInTheDocument();
  });

  it('completes inline and selects the completion when autocomplete is both', async () => {
    const user = userEvent.setup();
    render(<Harness autocomplete="both" />);

    await user.click(input());
    await user.type(input(), 'brem');

    const field = input() as HTMLInputElement;
    await waitFor(() => expect(field.value).toBe('Bremen'));
    expect(field.selectionStart).toBe(4);
    expect(field.selectionEnd).toBe(6);
  });

  it('does not fight a deletion when autocomplete is both', async () => {
    const user = userEvent.setup();
    render(<Harness autocomplete="both" />);

    const field = input() as HTMLInputElement;
    await user.click(field);
    await user.type(field, 'brem');
    await waitFor(() => expect(field.value).toBe('Bremen'));

    // With the completion selected, Backspace removes it and must not have it
    // put straight back, which is what makes the field feel frozen.
    //
    // The result keeps the option's capitalisation rather than the letters the
    // user originally typed, which is what a browser's own inline completion
    // does: the typed prefix is replaced by the match, so deleting the tail
    // leaves "Brem" and not "brem".
    await user.keyboard('{Backspace}');
    expect(field.value).toBe('Brem');
  });
});
