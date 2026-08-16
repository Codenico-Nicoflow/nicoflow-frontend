import { PROJECT_STATUS } from '@nicoflow/shared/types';
import { describe, expect, it } from 'vitest';

import { makeArea, makeProject } from '@/mocks/handlers';

import { pruneClosedIds, selectOpenAreaIds, selectTreeAreas, selectTreeProjects } from './tree';

const areaWith = (id: string, displayOrder: number, name = id) => ({
  ...makeArea({ id, name, displayOrder }),
  projects: [],
});

describe('selectTreeProjects', () => {
  it('keeps only active projects', () => {
    const projects = [
      makeProject({ id: 'a', status: PROJECT_STATUS.ACTIVE }),
      makeProject({ id: 'b', status: PROJECT_STATUS.ARCHIVED }),
      makeProject({ id: 'c', status: PROJECT_STATUS.COMPLETED }),
    ];
    expect(selectTreeProjects(projects).map(p => p.id)).toEqual(['a']);
  });

  it('orders by displayOrder', () => {
    const projects = [
      makeProject({ id: 'a', name: 'Zebra', displayOrder: 1 }),
      makeProject({ id: 'b', name: 'Apple', displayOrder: 0 }),
    ];
    expect(selectTreeProjects(projects).map(p => p.id)).toEqual(['b', 'a']);
  });

  it('keeps the server order for equal displayOrder instead of sorting by name', () => {
    const projects = [
      makeProject({ id: 'a', name: 'Zebra', displayOrder: 0 }),
      makeProject({ id: 'b', name: 'Apple', displayOrder: 0 }),
    ];
    // The /areas board sorts on displayOrder alone; a name tiebreak here would
    // show the two surfaces in different orders, since new rows arrive at 0.
    expect(selectTreeProjects(projects).map(p => p.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when nothing is active', () => {
    expect(selectTreeProjects([makeProject({ status: PROJECT_STATUS.ARCHIVED })])).toEqual([]);
  });
});

describe('selectTreeAreas', () => {
  it('orders by displayOrder without mutating the input', () => {
    const areas = [areaWith('a2', 1), areaWith('a1', 0)];
    expect(selectTreeAreas(areas).map(a => a.id)).toEqual(['a1', 'a2']);
    expect(areas.map(a => a.id)).toEqual(['a2', 'a1']);
  });
});

describe('selectOpenAreaIds', () => {
  it('treats unknown areas as open so new areas need no stored entry', () => {
    const areas = [areaWith('a1', 0), areaWith('a2', 1)];
    expect(selectOpenAreaIds(areas, [])).toEqual(['a1', 'a2']);
  });

  it('omits areas the user closed', () => {
    const areas = [areaWith('a1', 0), areaWith('a2', 1)];
    expect(selectOpenAreaIds(areas, ['a1'])).toEqual(['a2']);
  });
});

describe('pruneClosedIds', () => {
  it('drops ids that no longer match a live area', () => {
    const areas = [areaWith('a1', 0)];
    expect(pruneClosedIds(areas, ['a1', 'deleted'])).toEqual(['a1']);
  });
});
