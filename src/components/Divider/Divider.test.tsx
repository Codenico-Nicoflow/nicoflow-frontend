import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from '.';

describe('Divider', () => {
  it('renders with default testid', () => {
    renderComponent(<Divider />);
    expect(screen.getByTestId('divider')).toBeInTheDocument();
  });

  it('accepts a custom data-testid', () => {
    renderComponent(<Divider data-testid="my-divider" />);
    expect(screen.getByTestId('my-divider')).toBeInTheDocument();
    expect(screen.queryByTestId('divider')).not.toBeInTheDocument();
  });

  it('forwards additional HTML div props like className', () => {
    renderComponent(<Divider className="my-custom-class" />);
    const el = screen.getByTestId('divider');
    expect(el).toHaveClass('my-custom-class');
  });
});
