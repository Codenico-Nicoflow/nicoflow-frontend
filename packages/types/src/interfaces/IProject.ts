import type { IconId } from '../icons';

export interface IProject {
  id: number;
  name: string;
  userId: number;
  status: 'active' | 'archived' | 'completed';
  categoryId: number;
  icon: IconId;
  dueDate: Date;
  isFavorite: boolean;
}
