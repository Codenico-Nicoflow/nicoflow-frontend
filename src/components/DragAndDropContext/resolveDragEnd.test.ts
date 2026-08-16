import type { AreaWithProjects } from '@nicoflow/shared/api';
import type { IProject } from '@nicoflow/shared/types';
import { describe, expect, it } from 'vitest';

import { areaDragId, projectDragId, resolveDragEnd } from './resolveDragEnd';

const project = (id: string, areaId: string, displayOrder: number): IProject => ({
  id,
  areaId,
  name: id,
  status: 'active',
  folderIcon: 'folder',
  isFavorite: false,
  displayOrder,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const board: AreaWithProjects[] = [
  {
    id: 'A',
    name: 'Area A',
    color: '#3B82F6',
    icon: 'folder',
    displayOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    projects: [project('p1', 'A', 0), project('p2', 'A', 1), project('p3', 'A', 2)],
  },
  {
    id: 'B',
    name: 'Area B',
    color: '#10B981',
    icon: 'folder',
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    projects: [project('p4', 'B', 0)],
  },
];

describe('resolveDragEnd', () => {
  it('returns noop on missing ids or self-drop', () => {
    expect(resolveDragEnd(null, projectDragId('p1'), board)).toEqual({ kind: 'noop' });
    expect(resolveDragEnd(projectDragId('p1'), null, board)).toEqual({ kind: 'noop' });
    expect(resolveDragEnd(projectDragId('p1'), projectDragId('p1'), board)).toEqual({ kind: 'noop' });
  });

  it('moves a project when dropped on a different area card', () => {
    const action = resolveDragEnd(projectDragId('p1'), areaDragId('B'), board);
    expect(action).toEqual({ kind: 'move-project', projectId: 'p1', targetAreaId: 'B' });
  });

  it('is a noop when a project is dropped on its own area card', () => {
    expect(resolveDragEnd(projectDragId('p1'), areaDragId('A'), board)).toEqual({ kind: 'noop' });
  });

  it('reorders within an area when dropped on a sibling project', () => {
    // Drag p3 (index 2) onto p1 (index 0) → new order p3, p1, p2.
    const action = resolveDragEnd(projectDragId('p3'), projectDragId('p1'), board);
    expect(action).toEqual({
      kind: 'reorder-projects',
      areaId: 'A',
      items: [
        { id: 'p3', displayOrder: 0 },
        { id: 'p1', displayOrder: 1 },
        { id: 'p2', displayOrder: 2 },
      ],
    });
  });

  it('moves (not reorders) when a project is dropped on a project in another area', () => {
    const action = resolveDragEnd(projectDragId('p1'), projectDragId('p4'), board);
    expect(action).toEqual({ kind: 'move-project', projectId: 'p1', targetAreaId: 'B' });
  });

  it('reorders areas when an area is dropped on another area', () => {
    // Drag B (index 1) onto A (index 0) → new order B, A.
    const action = resolveDragEnd(areaDragId('B'), areaDragId('A'), board);
    expect(action).toEqual({
      kind: 'reorder-areas',
      items: [
        { id: 'B', displayOrder: 0 },
        { id: 'A', displayOrder: 1 },
      ],
    });
  });

  it('returns string ids with no Number()/NaN coercion (R13 regression)', () => {
    const action = resolveDragEnd(projectDragId('p1'), areaDragId('B'), board);
    if (action.kind !== 'move-project') throw new Error('expected move-project');
    expect(typeof action.projectId).toBe('string');
    expect(typeof action.targetAreaId).toBe('string');
    expect(action.projectId).toBe('p1');
  });

  it('returns noop for an unknown project id', () => {
    expect(resolveDragEnd(projectDragId('ghost'), areaDragId('B'), board)).toEqual({ kind: 'noop' });
  });
});
