import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnimatedListItem } from '.';

describe('AnimatedListItem', () => {
  it('should render children correctly', () => {
    renderComponent(
      <AnimatedListItem>
        <div>Test Content</div>
      </AnimatedListItem>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByTestId('animated-list-item')).toBeInTheDocument();
  });

  it('should apply custom className and data-testid', () => {
    renderComponent(
      <AnimatedListItem className="custom-class" data-testid="custom-item">
        <div>Content</div>
      </AnimatedListItem>
    );

    const element = screen.getByTestId('custom-item');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('custom-class');
  });

  it('should handle animation props (index.ts and delay)', () => {
    renderComponent(
      <AnimatedListItem index={5} delay={0.1}>
        <div>Animated Content</div>
      </AnimatedListItem>
    );

    expect(screen.getByTestId('animated-list-item')).toBeInTheDocument();
    expect(screen.getByText('Animated Content')).toBeInTheDocument();
  });

  it('should render complex nested children', () => {
    renderComponent(
      <AnimatedListItem>
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </AnimatedListItem>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
