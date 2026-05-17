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

  it('renders children with a custom storageKey prop', () => {
    renderComponent(
      <ThemeProvider defaultTheme="light" storageKey="my-custom-theme-key">
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders children with dark defaultTheme', () => {
    renderComponent(
      <ThemeProvider defaultTheme="dark" storageKey="test-dark-theme">
        <div>Dark content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Dark content')).toBeInTheDocument();
  });
});
