import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ModeToggle } from '.';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ setTheme: mockSetTheme, theme: 'light', resolvedTheme: 'light' }),
}));

describe('ModeToggle', () => {
  it('renders the trigger button with aria-label="Toggle theme"', () => {
    renderComponent(<ModeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('clicking trigger opens dropdown with Light, Dark, System options', async () => {
    const user = userEvent.setup();

    renderComponent(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('clicking "Light" calls setTheme("light")', async () => {
    const user = userEvent.setup();

    renderComponent(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByText('Light'));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('clicking "Dark" calls setTheme("dark")', async () => {
    const user = userEvent.setup();

    renderComponent(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByText('Dark'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('clicking "System" calls setTheme("system")', async () => {
    const user = userEvent.setup();

    renderComponent(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByText('System'));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
