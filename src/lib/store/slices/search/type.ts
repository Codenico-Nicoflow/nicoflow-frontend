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

// Notes (E-054). `excerpt` is server-derived plain text — never a document body,
// and never derived on the client.
//
// `projectId`/`projectName` come back as EMPTY STRINGS (not null) for an ORPHANED
// note: deleting a project sets notes.project_id to NULL rather than destroying
// the rows, and the Go struct types both as `string`. Search is user-scoped, so
// it is the only surface that can still find those notes — test for truthiness,
// never for `null`.
export type INoteResult = {
  id: string;
  title: string;
  excerpt: string;
  projectName: string;
  projectId: string;
};

export type ISearchResults = {
  tasks: ITaskResult[];
  projects: IProjectResult[];
  areas: IAreaResult[];
  notes: INoteResult[];
};
