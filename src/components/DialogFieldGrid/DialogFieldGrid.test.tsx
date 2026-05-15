import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DialogFieldGrid } from '.';

describe('DialogFieldGrid', () => {
  it('renders children', () => {
    renderComponent(
      <DialogFieldGrid>
        <div>Child One</div>
        <div>Child Two</div>
      </DialogFieldGrid>
    );

    expect(screen.getByText('Child One')).toBeInTheDocument();
    expect(screen.getByText('Child Two')).toBeInTheDocument();
  });

  it('renders with default testid', () => {
    renderComponent(
      <DialogFieldGrid>
        <div>content</div>
      </DialogFieldGrid>
    );
    expect(screen.getByTestId('dialog-field-grid')).toBeInTheDocument();
  });

  it('accepts a custom data-testid', () => {
    renderComponent(
      <DialogFieldGrid data-testid="my-grid">
        <div>content</div>
      </DialogFieldGrid>
    );
    expect(screen.getByTestId('my-grid')).toBeInTheDocument();
  });

  it('accepts a custom className', () => {
    renderComponent(
      <DialogFieldGrid className="extra-class">
        <div>content</div>
      </DialogFieldGrid>
    );
    expect(screen.getByTestId('dialog-field-grid')).toHaveClass('extra-class');
  });

  it('wraps fullWidth children in sm:col-span-2 when columns={2}', () => {
    const FullWidthChild = ({ fullWidth: _fullWidth }: { fullWidth?: boolean }) => <div>Full Width</div>;

    renderComponent(
      <DialogFieldGrid columns={2}>
        <FullWidthChild fullWidth={true} />
        <div>Normal</div>
      </DialogFieldGrid>
    );

    expect(screen.getByText('Full Width')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });
});
