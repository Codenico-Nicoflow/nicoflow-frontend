import type { IProject } from '@nicoflow/shared/types';

/**
 * How many projects may be starred at once. The cap is enforced in the UI only
 * (no backend check), so it is advisory: a second tab or a direct API call can
 * exceed it. That is acceptable because favorites are a display preference —
 * the worst case is a rail with extra icons, which `selectFavorites` clamps.
 */
export const MAX_FAVORITES = 5;

/** Favorites shown in the rail: starred projects, by name, clamped to the cap. */
export const selectFavorites = (projects: IProject[]): IProject[] =>
  projects
    .filter(p => p.isFavorite)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_FAVORITES);

/** False when starring another project would exceed the cap. */
export const canFavoriteMore = (projects: IProject[]): boolean =>
  projects.filter(p => p.isFavorite).length < MAX_FAVORITES;

/**
 * Whether a star toggle may proceed. Un-starring is always allowed, so a user
 * who is already at (or over) the cap can still get back under it.
 */
export const canToggleFavorite = (projects: IProject[], project: IProject): boolean =>
  project.isFavorite ? true : canFavoriteMore(projects);
