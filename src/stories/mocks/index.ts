import type { IArea, IBucket, IProject, ITask, IUser } from '@/lib/types';
import type { IconId } from '@/lib/types/icons';

export const mockUser = (overrides?: Partial<IUser>): IUser => ({
  id: 1,
  email: 'demo@nicoflow.app',
  firstName: 'Demo',
  lastName: 'User',
  username: 'demouser',
  theme: 'light',
  imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  status: 'premium',
  ...overrides,
});

export const mockArea = (overrides?: Partial<IArea>): IArea => ({
  id: 1,
  name: 'Work',
  icon: 'briefcase' satisfies IconId,
  sortOrder: 1,
  userId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockProject = (overrides?: Partial<IProject>): IProject => ({
  id: 1,
  name: 'Sample Project',
  userId: 1,
  areaId: 1,
  area: mockArea(),
  status: 'active',
  icon: 'folder' satisfies IconId,
  sortOrder: 1,
  isFavorite: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockTask = (overrides?: Partial<ITask>): ITask => ({
  id: 1,
  name: 'Sample Task',
  projectId: 1,
  description: 'A sample task description',
  status: 'inbox',
  priority: 'medium',
  dueDate: null,
  scheduledFor: null,
  estimatedMinutes: null,
  url: undefined,
  sortOrder: 1,
  completedAt: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockBucketItem = (overrides?: Partial<IBucket>): IBucket => ({
  id: 1,
  userId: 1,
  content: 'Sample bucket item content',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});
