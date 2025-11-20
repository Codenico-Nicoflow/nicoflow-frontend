import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '.';

describe('EmptyState', () => {
  it('should render icon and title correctly', () => {
    renderComponent(<EmptyState icon={Inbox} title="No items found" />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should display description when provided', () => {
    renderComponent(<EmptyState icon={Inbox} title="No items" description="Create your first item to get started" />);

    expect(screen.getByText('Create your first item to get started')).toBeInTheDocument();
  });

  it('should render action component when provided', () => {
    renderComponent(<EmptyState icon={Inbox} title="No items" action={<button>Create Item</button>} />);

    expect(screen.getByRole('button', { name: /create item/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderComponent(<EmptyState icon={Inbox} title="No items" className="custom-empty-state" />);

    expect(container.querySelector('.custom-empty-state')).toBeInTheDocument();
  });
});
