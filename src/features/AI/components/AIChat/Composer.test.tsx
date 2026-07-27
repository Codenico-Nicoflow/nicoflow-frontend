import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MAX_CONTENT_LENGTH } from '../../hooks';

import { Composer } from './Composer';

const setup = (props?: Partial<Parameters<typeof Composer>[0]>) => {
  const onSend = vi.fn();
  const onStop = vi.fn();
  renderComponent(<Composer streaming={false} onSend={onSend} onStop={onStop} {...props} />);
  return { onSend, onStop };
};

describe('Composer', () => {
  it('sends on Enter and clears the input', async () => {
    const user = userEvent.setup();
    const { onSend } = setup();

    const input = screen.getByTestId('ai-composer-input');
    await user.type(input, 'hello there');
    await user.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledWith('hello there');
    expect(input).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter without sending', async () => {
    const user = userEvent.setup();
    const { onSend } = setup();

    const input = screen.getByTestId('ai-composer-input');
    await user.type(input, 'line one');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(input, 'line two');

    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue('line one\nline two');
  });

  it('does not send blank / whitespace-only input', async () => {
    const user = userEvent.setup();
    const { onSend } = setup();

    await user.type(screen.getByTestId('ai-composer-input'), '   ');
    await user.keyboard('{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables the input and shows Stop while streaming', async () => {
    const user = userEvent.setup();
    const { onStop } = setup({ streaming: true });

    expect(screen.getByTestId('ai-composer-input')).toBeDisabled();
    expect(screen.queryByTestId('ai-composer-send')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('ai-composer-stop'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('shows the counter near the limit and blocks over-limit sends', async () => {
    const user = userEvent.setup();
    const { onSend } = setup();

    const input = screen.getByTestId('ai-composer-input');
    // Paste past the cap in one shot (typing 2000+ chars is far too slow).
    await user.click(input);
    await user.paste('x'.repeat(MAX_CONTENT_LENGTH + 5));

    expect(screen.getByTestId('ai-composer-counter')).toHaveTextContent(
      `${MAX_CONTENT_LENGTH + 5} / ${MAX_CONTENT_LENGTH}`
    );
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });
});
