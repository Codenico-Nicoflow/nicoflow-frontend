import { describe, expect, it } from 'vitest';

import type { IProject } from '@/lib/types';

import { canFavoriteMore, canToggleFavorite, MAX_FAVORITES, selectFavorites } from './favorites';

const makeProject = (overrides: Partial<IProject> = {}): IProject =>
  ({
    id: 'p1',
    areaId: 'a1',
    name: 'Project',
    status: 'active',
    folderIcon: 'folder',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }) as IProject;

const favorites = (count: number) =>
  Array.from({ length: count }, (_, i) => makeProject({ id: `f${i}`, name: `Fav ${i}`, isFavorite: true }));

describe('selectFavorites', () => {
  it('keeps only starred projects', () => {
    const projects = [
      makeProject({ id: 'p1', name: 'Alpha', isFavorite: true }),
      makeProject({ id: 'p2', name: 'Beta' }),
    ];

    expect(selectFavorites(projects).map(p => p.id)).toEqual(['p1']);
  });

  it('sorts alphabetically by name, not by input order', () => {
    const projects = [
      makeProject({ id: 'p1', name: 'Zebra', isFavorite: true }),
      makeProject({ id: 'p2', name: 'Apple', isFavorite: true }),
      makeProject({ id: 'p3', name: 'Mango', isFavorite: true }),
    ];

    expect(selectFavorites(projects).map(p => p.name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('clamps to the cap when more are starred than the rail can show', () => {
    expect(selectFavorites(favorites(MAX_FAVORITES + 3))).toHaveLength(MAX_FAVORITES);
  });

  it('returns an empty list when nothing is starred', () => {
    expect(selectFavorites([makeProject(), makeProject({ id: 'p2' })])).toEqual([]);
  });
});

describe('canFavoriteMore', () => {
  it('allows starring below the cap', () => {
    expect(canFavoriteMore(favorites(MAX_FAVORITES - 1))).toBe(true);
  });

  it('blocks starring at the cap', () => {
    expect(canFavoriteMore(favorites(MAX_FAVORITES))).toBe(false);
  });

  it('stays blocked when the advisory cap was already exceeded elsewhere', () => {
    expect(canFavoriteMore(favorites(MAX_FAVORITES + 2))).toBe(false);
  });
});

describe('canToggleFavorite', () => {
  it('always allows un-starring, even at the cap', () => {
    const starred = favorites(MAX_FAVORITES);

    expect(canToggleFavorite(starred, starred[0]!)).toBe(true);
  });

  it('blocks starring a new project once the cap is reached', () => {
    expect(canToggleFavorite(favorites(MAX_FAVORITES), makeProject({ id: 'new' }))).toBe(false);
  });

  it('allows starring a new project below the cap', () => {
    expect(canToggleFavorite(favorites(MAX_FAVORITES - 1), makeProject({ id: 'new' }))).toBe(true);
  });
});
