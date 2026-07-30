import { http, HttpResponse } from 'msw';

import type { AreaWithProjects } from '@/lib/store/slices/area/type';
import type { IArea, IBucket, IFocusSession, IProject, ISubtask, ITask, IUser } from '@/lib/types';
import { TaskEnergy, TaskPriority, TaskStatus } from '@/lib/types/constants';

export const mockUser: IUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  imageUrl: '',
  status: 'regular',
};

export const mockAuthResponse = {
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
};

export const mockProject: IProject = {
  id: 'project-1',
  areaId: 'area-1',
  name: 'Redesign',
  status: 'active',
  folderIcon: 'rocket',
  dueDate: null,
  isFavorite: true,
  description: 'Revamp the areas and projects experience.',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockAreaWithProjects: AreaWithProjects = {
  id: 'area-1',
  name: 'Work',
  color: '#c4622d',
  icon: 'briefcase',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  projects: [mockProject],
};

// ── Factory helpers ───────────────────────────────────────────────────────
// Current string-ID contract; override per call. Shared by tests and stories
// so the two never drift (the old src/stories/mocks copy was a stale dupe).
export const makeUser = (overrides?: Partial<IUser>): IUser => ({ ...mockUser, ...overrides });

export const makeProject = (overrides?: Partial<IProject>): IProject => ({ ...mockProject, ...overrides });

export const makeArea = (overrides?: Partial<IArea>): IArea => ({
  id: 'area-1',
  name: 'Work',
  color: '#c4622d',
  icon: 'briefcase',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const makeAreaWithProjects = (overrides?: Partial<AreaWithProjects>): AreaWithProjects => ({
  ...mockAreaWithProjects,
  ...overrides,
});

export const makeTask = (overrides?: Partial<ITask>): ITask => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Sample Task',
  notes: null,
  status: TaskStatus.INBOX,
  priority: TaskPriority.MEDIUM,
  energy: TaskEnergy.MEDIUM,
  rollsOver: true,
  scheduledFor: null,
  scheduledTime: null,
  estimatedMinutes: null,
  url: null,
  displayOrder: 0,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  totalFocusSeconds: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  ...overrides,
});

export const makeSubtask = (overrides?: Partial<ISubtask>): ISubtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Sample Subtask',
  done: false,
  position: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const makeBucket = (overrides?: Partial<IBucket>): IBucket => ({
  id: 'bucket-1',
  userId: '1',
  content: 'Sample bucket item content',
  processedAt: null,
  processingResult: null,
  createdTaskId: null,
  createdNoteId: null,
  projectId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const makeFocusSession = (overrides?: Partial<IFocusSession>): IFocusSession => ({
  id: 'session-1',
  taskId: 'task-1',
  startedAt: '2026-01-01T09:00:00Z',
  endedAt: null,
  lastSeen: '2026-01-01T09:00:00Z',
  durationSeconds: 0,
  ...overrides,
});

const envelope = <T>(data: T) => ({ data, error: null });

export const handlers = [
  http.get('http://localhost:8080/v1/areas/with-projects', () => HttpResponse.json(envelope([]))),
  // Registered before /attachments so the literal path wins over the list route.
  http.get('http://localhost:8080/v1/attachments/usage', () =>
    HttpResponse.json(envelope({ usedBytes: 0, limitBytes: 100 * 1024 * 1024 }))
  ),
  // TaskDialog lists attachments for whatever task it opens; without a default
  // any suite that opens the dialog logs an unhandled-request warning.
  http.get('http://localhost:8080/v1/attachments', () => HttpResponse.json(envelope({ items: [] }))),
  http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/projects', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/projects/:projectId/tasks', () => HttpResponse.json(envelope({ items: [] }))),
  http.get('http://localhost:8080/v1/focus', () => HttpResponse.json(envelope({ items: [] }))),
  // Calendar range (E-051) — flat window the hour grid reads.
  http.get('http://localhost:8080/v1/tasks', () => HttpResponse.json(envelope({ items: [] }))),
  // Focus timer segments (E-049): open echoes the requested task; close returns
  // the segment with a measured duration; heartbeat is a silent 204.
  http.post('http://localhost:8080/v1/focus/sessions', async ({ request }) => {
    const body = (await request.json()) as { taskId: string };
    return HttpResponse.json(envelope(makeFocusSession({ taskId: body.taskId })), { status: 201 });
  }),
  http.post('http://localhost:8080/v1/focus/sessions/current/close', () =>
    HttpResponse.json(envelope(makeFocusSession({ endedAt: '2026-01-01T09:00:30Z', durationSeconds: 30 })))
  ),
  http.post('http://localhost:8080/v1/focus/sessions/current/heartbeat', () => new HttpResponse(null, { status: 204 })),
  http.get('http://localhost:8080/v1/time-spread', () =>
    HttpResponse.json(envelope({ today: [], tomorrow: [], thisWeek: [] }))
  ),
  http.patch('http://localhost:8080/v1/tasks/:id/reorder', ({ params }) =>
    HttpResponse.json(envelope(makeTask({ id: String(params['id']) })))
  ),
  http.patch('http://localhost:8080/v1/tasks/:id/schedule', async ({ params, request }) => {
    const body = (await request.json()) as { scheduledFor: string | null; rollsOver?: boolean };
    return HttpResponse.json(envelope(makeTask({ id: String(params['id']), ...body })));
  }),
  http.get('http://localhost:8080/v1/bucket', () => HttpResponse.json(envelope({ items: [] }))),
  http.get('http://localhost:8080/v1/users/profile', () => HttpResponse.json(envelope(mockUser))),
  http.patch('http://localhost:8080/v1/users/me', async ({ request }) => {
    const body = (await request.json()) as Partial<IUser>;
    return HttpResponse.json(envelope({ ...mockUser, ...body }));
  }),

  http.post('http://localhost:8080/v1/auth/login', () => HttpResponse.json(envelope(mockAuthResponse))),
  http.post('http://localhost:8080/v1/auth/register', () => HttpResponse.json(envelope(mockAuthResponse))),
  http.post('http://localhost:8080/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.post('http://localhost:8080/v1/auth/logout-all', () => new HttpResponse(null, { status: 204 })),
  http.post('http://localhost:8080/v1/auth/refresh-token', () =>
    HttpResponse.json(envelope({ ...mockAuthResponse, token: 'new-mock-access-token' }))
  ),
  http.post('http://localhost:8080/v1/auth/forgot-password', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/reset-password', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/verify-email', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/resend-verification', () => HttpResponse.json(envelope(null))),
  http.get('http://localhost:8080/v1/search', () =>
    HttpResponse.json(envelope({ tasks: [], projects: [], areas: [] }))
  ),
  // Default AI quota: a Pro user well under the monthly cap, so surfaces that
  // merely mount the chat aren't walled. Suites override per-case.
  http.get('http://localhost:8080/v1/ai/usage', () =>
    HttpResponse.json(envelope({ used: 12, limit: 500, scope: 'month', month: '2026-07' }))
  ),
];
