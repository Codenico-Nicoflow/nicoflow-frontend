import type { IArea, IProject } from '@/lib/types';

export type GetAreaRequest = string;

export type CreateAreaRequest = {
  name: string;
  color?: string;
  icon?: string;
};

export type UpdateAreaRequest = {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
};

export type ReorderAreaItem = {
  id: string;
  displayOrder: number;
};

export type ReorderAreasRequest = {
  items: ReorderAreaItem[];
};

export type AreaWithProjects = IArea & { projects: IProject[] };

export type GetAllAreasResponse = { items: IArea[]; nextCursor: string };
export type GetAreasWithProjectsResponse = AreaWithProjects[];
export type GetAreaResponse = IArea;
export type CreateAreaResponse = IArea;
export type UpdateAreaResponse = IArea;
export type DeleteAreaResponse = void;
export type ReorderAreasResponse = { updated: number };
