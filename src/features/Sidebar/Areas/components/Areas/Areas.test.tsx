import { describe, expect, it } from 'vitest';

import type { IArea } from '@/lib/types';

const sortAreasByDisplayOrder = (areas: IArea[]): IArea[] =>
  [...areas].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

describe('Areas — displayOrder sort', () => {
  it('sorts areas ascending by displayOrder', () => {
    const areas: IArea[] = [
      {
        id: 'area-3',
        name: 'Work',
        color: '#aaa',
        displayOrder: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'area-1',
        name: 'Personal',
        color: '#bbb',
        displayOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'area-2',
        name: 'Side Projects',
        color: '#ccc',
        displayOrder: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const sorted = sortAreasByDisplayOrder(areas);

    expect(sorted.map(a => a.id)).toEqual(['area-1', 'area-2', 'area-3']);
  });

  it('treats missing displayOrder as 0 and sorts those first', () => {
    const areas: IArea[] = [
      {
        id: 'area-b',
        name: 'Beta',
        color: '#000',
        displayOrder: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'area-a',
        name: 'Alpha',
        color: '#111',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const sorted = sortAreasByDisplayOrder(areas);

    expect(sorted[0].id).toBe('area-a');
    expect(sorted[1].id).toBe('area-b');
  });

  it('does not mutate the original array', () => {
    const areas: IArea[] = [
      {
        id: 'z',
        name: 'Z',
        color: '#000',
        displayOrder: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'a',
        name: 'A',
        color: '#111',
        displayOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const originalOrder = areas.map(a => a.id);
    sortAreasByDisplayOrder(areas);

    expect(areas.map(a => a.id)).toEqual(originalOrder);
  });
});
