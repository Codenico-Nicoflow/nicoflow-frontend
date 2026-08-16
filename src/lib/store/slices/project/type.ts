import type { IProject } from '@nicoflow/shared/types';

export type GetProjectsResponse = { items: IProject[]; nextCursor: string };
export type GetProjectResponse = IProject;

export type CreateProjectRequest = {
  areaId: string;
  name: string;
  status?: 'active' | 'completed' | 'archived';
  folderIcon?: string;
  dueDate?: string | null;
  isFavorite?: boolean;
  description?: string | null;
};

export type UpdateProjectRequest = {
  id: string;
  name?: string;
  // Omit to leave the area unchanged; a project must always belong to an area,
  // so this is a non-null id to move into (the backend rejects an empty areaId).
  areaId?: string;
  status?: 'active' | 'completed' | 'archived';
  folderIcon?: string;
  dueDate?: string | null;
  isFavorite?: boolean;
  description?: string | null;
};

export type ReorderProjectItem = {
  id: string;
  displayOrder: number;
};

export type ReorderProjectsRequest = {
  items: ReorderProjectItem[];
};

export type CreateProjectResponse = IProject;
export type UpdateProjectResponse = IProject;
export type DeleteProjectRequest = string;
export type GetProjectRequest = string;
export type DeleteProjectResponse = void;
export type ReorderProjectsResponse = { updated: number };
