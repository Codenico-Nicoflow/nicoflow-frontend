import type { IconId } from '../icons';
import type { IProject } from './IProject';

export interface ICategory {
  id: number;
  name: string;
  icon: IconId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  projects?: IProject[];
}
