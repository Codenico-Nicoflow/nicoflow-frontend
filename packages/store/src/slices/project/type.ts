import type { IProject } from '@my-monorepo/types';

/* Project API */
export type GetProjectsResponse = IProject[];
export type CreateProjectRequest = Partial<IProject>;
export type CreateProjectResponse = IProject;
export type UpdateProjectResponse = IProject;

export type UpdateProjectRequest = Partial<IProject>;
export type DeleteProjectRequest = number;
export type GetProjectRequest = number;
export type GetProjectResponse = IProject;
export type DeleteProjectResponse = { message: string };
