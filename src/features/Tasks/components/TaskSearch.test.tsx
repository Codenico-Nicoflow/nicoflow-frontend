import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskSearch from './TaskSearch';

describe('TaskSearch', () => {
  it('fires onChange with each typed character', async () => {
    const onChange = vi.fn();
    renderComponent(<TaskSearch value="" onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'abc');

    // Controlled input with empty value → each keystroke reports a single char.
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'b');
    expect(onChange).toHaveBeenNthCalledWith(3, 'c');
  });

  it('clears the value when the clear button is pressed', async () => {
    const onChange = vi.fn();
    renderComponent(<TaskSearch value="draft" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  });

  it('hides the clear button when the value is empty', () => {
    renderComponent(<TaskSearch value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the provided placeholder over the default', () => {
    renderComponent(<TaskSearch value="" onChange={vi.fn()} placeholder="Find tasks" />);

    expect(screen.getByPlaceholderText('Find tasks')).toBeInTheDocument();
  });
});
