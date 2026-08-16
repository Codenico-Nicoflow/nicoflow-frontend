import { arrayMove } from '@dnd-kit/sortable';
import type { AreaWithProjects } from '@nicoflow/shared/api';
import type { IProject } from '@nicoflow/shared/types';

// Draggable/droppable id conventions used across the board:
//   project-{id}  — a ProjectRow (draggable + sortable)
//   area-{id}     — an AreaCard   (droppable + sortable)
export const PROJECT_PREFIX = 'project-';
export const AREA_PREFIX = 'area-';

export const projectDragId = (id: string) => `${PROJECT_PREFIX}${id}`;
export const areaDragId = (id: string) => `${AREA_PREFIX}${id}`;

const stripPrefix = (raw: string, prefix: string) => (raw.startsWith(prefix) ? raw.slice(prefix.length) : '');

/** A single ordered item for a reorder mutation. */
export interface OrderedItem {
  id: string;
  displayOrder: number;
}

/**
 * The resolved intent of a drag-end gesture. The component maps each kind to a
 * specific RTK Query mutation; `noop` means nothing should fire.
 */
export type DragAction =
  | { kind: 'noop' }
  | { kind: 'move-project'; projectId: string; targetAreaId: string }
  | { kind: 'reorder-projects'; areaId: string; items: OrderedItem[] }
  | { kind: 'reorder-areas'; items: OrderedItem[] };

/** Sequential displayOrder values (0-based) for an ordered id list. */
const toOrderedItems = (ids: string[]): OrderedItem[] => ids.map((id, index) => ({ id, displayOrder: index }));

const findProjectArea = (areas: AreaWithProjects[], projectId: string) =>
  areas.find(a => (a.projects ?? []).some(p => p.id === projectId));

/**
 * Pure resolver for a drag-end event. Given the raw active/over ids and the
 * current board state, it decides which mutation should fire and with what
 * payload — with no side effects, so it can be unit-tested deterministically.
 *
 * Rules:
 *  - project dropped on a *different* area card  → move-project
 *  - project dropped on another project in the *same* area → reorder-projects
 *  - project dropped on another project in a *different* area → move-project
 *    (cross-area moves take precedence; in-area position is settled by reorder)
 *  - area dropped on another area → reorder-areas
 *  - dropped on itself / nothing / unknown → noop
 */
export function resolveDragEnd(
  activeId: string | null | undefined,
  overId: string | null | undefined,
  areas: AreaWithProjects[]
): DragAction {
  if (!activeId || !overId || activeId === overId) {
    return { kind: 'noop' };
  }

  // ── area ↔ area reorder ──────────────────────────────────────────────────
  if (activeId.startsWith(AREA_PREFIX) && overId.startsWith(AREA_PREFIX)) {
    const fromId = stripPrefix(activeId, AREA_PREFIX);
    const toId = stripPrefix(overId, AREA_PREFIX);
    const fromIdx = areas.findIndex(a => a.id === fromId);
    const toIdx = areas.findIndex(a => a.id === toId);
    if (fromIdx < 0 || toIdx < 0) return { kind: 'noop' };

    const reordered = arrayMove(areas, fromIdx, toIdx).map(a => a.id);
    return { kind: 'reorder-areas', items: toOrderedItems(reordered) };
  }

  // ── project drag ─────────────────────────────────────────────────────────
  if (activeId.startsWith(PROJECT_PREFIX)) {
    const projectId = stripPrefix(activeId, PROJECT_PREFIX);
    const sourceArea = findProjectArea(areas, projectId);
    if (!sourceArea) return { kind: 'noop' };

    // dropped on an area card
    if (overId.startsWith(AREA_PREFIX)) {
      const targetAreaId = stripPrefix(overId, AREA_PREFIX);
      if (!targetAreaId || targetAreaId === sourceArea.id) return { kind: 'noop' };
      return { kind: 'move-project', projectId, targetAreaId };
    }

    // dropped on another project
    if (overId.startsWith(PROJECT_PREFIX)) {
      const overProjectId = stripPrefix(overId, PROJECT_PREFIX);
      const targetArea = findProjectArea(areas, overProjectId);
      if (!targetArea) return { kind: 'noop' };

      // different area → treat as a move to that area
      if (targetArea.id !== sourceArea.id) {
        return { kind: 'move-project', projectId, targetAreaId: targetArea.id };
      }

      // same area → reorder within it
      const ids = (sourceArea.projects ?? []).map((p: IProject) => p.id);
      const fromIdx = ids.indexOf(projectId);
      const toIdx = ids.indexOf(overProjectId);
      if (fromIdx < 0 || toIdx < 0) return { kind: 'noop' };

      const reordered = arrayMove(ids, fromIdx, toIdx);
      return { kind: 'reorder-projects', areaId: sourceArea.id, items: toOrderedItems(reordered) };
    }
  }

  return { kind: 'noop' };
}
