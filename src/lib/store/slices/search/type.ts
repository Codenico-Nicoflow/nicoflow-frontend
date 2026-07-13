export type ITaskResult = {
  id: string;
  title: string;
  excerpt: string;
  projectName: string;
  projectId: string;
};

export type IProjectResult = {
  id: string;
  name: string;
  areaName: string;
};

export type IAreaResult = {
  id: string;
  name: string;
};

export type ISearchResults = {
  tasks: ITaskResult[];
  projects: IProjectResult[];
  areas: IAreaResult[];
};
