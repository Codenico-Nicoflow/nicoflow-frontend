import type { AreaWithProjects } from '@nicoflow/shared/api';
import type { IProject } from '@nicoflow/shared/types';
import { PROJECT_STATUS } from '@nicoflow/shared/types';

// displayOrder only, matching AreasBoard. Ties keep the server's order (Array
// #sort is stable) rather than falling back to name — a name tiebreak would
// reorder the rail against the board, since new rows all arrive at order 0.
const byDisplayOrder = <T extends { displayOrder?: number }>(a: T, b: T) =>
  (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

/**
 * Projects shown under an area in the rail tree: active only, by displayOrder.
 * Completed/archived projects stay on the /areas board — a permanent nav column
 * that lists them grows forever and stops being scannable.
 */
export const selectTreeProjects = (projects: IProject[]): IProject[] =>
  projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).sort(byDisplayOrder);

/** Areas by displayOrder. Areas with no active projects still render — the
 *  group header is the "add a project here" affordance on the board. */
export const selectTreeAreas = (areas: AreaWithProjects[]): AreaWithProjects[] => [...areas].sort(byDisplayOrder);

/**
 * Which areas render open. The persisted set stores *closed* ids, so areas
 * default to open and newly created ones open without touching storage.
 * Filters against the live areas so ids of deleted areas can't accumulate.
 */
export const selectOpenAreaIds = (areas: AreaWithProjects[], closedIds: string[]): string[] => {
  const closed = new Set(closedIds);
  return areas.filter(a => !closed.has(a.id)).map(a => a.id);
};

/** Drops ids that no longer match a live area, so storage can't grow unbounded. */
export const pruneClosedIds = (areas: AreaWithProjects[], closedIds: string[]): string[] => {
  const live = new Set(areas.map(a => a.id));
  return closedIds.filter(id => live.has(id));
};
