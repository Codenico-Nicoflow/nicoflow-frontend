import type { IProject } from '@/lib/types';

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
  areaId?: string | null;
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
