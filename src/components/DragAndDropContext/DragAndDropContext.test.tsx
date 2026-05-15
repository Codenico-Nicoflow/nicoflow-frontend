import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DragAndDropContext } from '.';

describe('DragAndDropContext', () => {
  it('renders children', () => {
    renderComponent(
      <DragAndDropContext>
        <div>Drop zone content</div>
      </DragAndDropContext>
    );
    expect(screen.getByText('Drop zone content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    renderComponent(
      <DragAndDropContext>
        <div>Item A</div>
        <div>Item B</div>
        <div>Item C</div>
      </DragAndDropContext>
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
  });

  it('does not crash when no draggable items are present', () => {
    expect(() =>
      renderComponent(
        <DragAndDropContext>
          <div />
        </DragAndDropContext>
      )
    ).not.toThrow();
  });
});
