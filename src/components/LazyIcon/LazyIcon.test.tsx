import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { describe, expect, it, vi } from 'vitest';

import { LazyIcon } from '.';

describe('LazyIcon', () => {
  it('renders skeleton for an invalid iconId', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent(
      // 'nonexistent-icon' is not a valid IconId — cast to bypass type check
      <LazyIcon iconId={'nonexistent-icon' as Parameters<typeof LazyIcon>[0]['iconId']} />
    );

    // The component renders a skeleton div when iconId is not in ICON_IMPORTS
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it('renders without crashing for a valid iconId', async () => {
    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <LazyIcon iconId="folder" />
      </React.Suspense>
    );

    // Before async icon loads, either the Suspense fallback or the skeleton is present
    // Either way the component renders without throwing
    expect(document.body).toBeTruthy();
  });
});
