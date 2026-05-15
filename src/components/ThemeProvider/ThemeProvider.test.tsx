import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '.';

describe('ThemeProvider', () => {
  it('renders children', () => {
    renderComponent(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <div>Theme child</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Theme child')).toBeInTheDocument();
  });

  it('uses the provided storageKey in localStorage', () => {
    renderComponent(
      <ThemeProvider defaultTheme="light" storageKey="my-custom-theme-key">
        <div>Content</div>
      </ThemeProvider>
    );
    expect(localStorage.getItem('my-custom-theme-key')).not.toBeNull();
  });

  it('applies defaultTheme when no stored preference exists', () => {
    renderComponent(
      <ThemeProvider defaultTheme="dark" storageKey="test-dark-theme">
        <div>Dark content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Dark content')).toBeInTheDocument();
  });
});
