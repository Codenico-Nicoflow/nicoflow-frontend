import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListItemCard } from '.';

describe('ListItemCard', () => {
  it('renders children', () => {
    renderComponent(
      <ListItemCard>
        <span>Card content</span>
      </ListItemCard>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('uses default testid', () => {
    renderComponent(
      <ListItemCard>
        <span>content</span>
      </ListItemCard>
    );
    expect(screen.getByTestId('list-item-card')).toBeInTheDocument();
  });

  it('accepts a custom data-testid', () => {
    renderComponent(
      <ListItemCard data-testid="my-card">
        <span>content</span>
      </ListItemCard>
    );
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
    expect(screen.queryByTestId('list-item-card')).not.toBeInTheDocument();
  });

  it('renders with borderColor="success" without crashing', () => {
    renderComponent(
      <ListItemCard borderColor="success">
        <span>content</span>
      </ListItemCard>
    );
    expect(screen.getByTestId('list-item-card')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    renderComponent(
      <ListItemCard ref={ref}>
        <span>content</span>
      </ListItemCard>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
