import type {
  IArea,
  IBucket,
  IFocusSession,
  IHabit,
  IHabitCell,
  IHabitDetail,
  IHabitSubject,
  INote,
  INoteDetail,
  IProject,
  ISubtask,
  ITask,
  IUser,
} from '@nicoflow/shared/types';
import { TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { http, HttpResponse } from 'msw';

import type { AreaWithProjects } from '@/lib/store/slices/area/type';

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
  status: TaskStatus.ACTIVE,
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

// Two builders, because the two note shapes are genuinely different documents:
// the list row carries `excerpt` and no body at all, the scalar carries the body
// and no excerpt. A single builder with an optional `content` would let a test
// read a body off a list row — exactly the bug the split shape exists to prevent.
export const makeNote = (overrides?: Partial<INote>): INote => ({
  id: 'note-1',
  projectId: 'project-1',
  title: 'Sample Note',
  excerpt: 'Sample note body flattened to plain text.',
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const makeNoteDetail = (overrides?: Partial<INoteDetail>): INoteDetail => ({
  id: 'note-1',
  projectId: 'project-1',
  title: 'Sample Note',
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sample note body flattened to plain text.' }] }],
  },
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Habits (E-055). The derived counters are all server-computed, so a fixture
// sets them explicitly rather than letting a test infer them from `cells` — the
// client never does that arithmetic and a fixture that did would be testing a
// rule the app does not implement.
export const makeHabit = (overrides?: Partial<IHabit>): IHabit => ({
  id: 'habit-1',
  name: 'Read',
  subject: 'reading',
  color: 'indigo',
  polarity: 'build',
  targetValue: 1,
  unit: null,
  scheduleKind: 'daily',
  byWeekday: null,
  timesPerWeek: null,
  streakUnit: 'day',
  currentStreak: 0,
  longestStreak: 0,
  dueToday: true,
  completedToday: false,
  loggedToday: false,
  todayValue: 0,
  periodProgress: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const makeHabitCell = (overrides?: Partial<IHabitCell>): IHabitCell => ({
  date: '2026-08-05',
  scheduled: true,
  value: 0,
  satisfied: false,
  progress: null,
  ...overrides,
});

export const makeHabitDetail = (overrides?: Partial<IHabitDetail>): IHabitDetail => ({
  ...makeHabit(),
  cells: [],
  ...overrides,
});

export const mockHabitSubjects: IHabitSubject[] = [
  { slug: 'reading', labelKey: 'habits.subject.reading' },
  { slug: 'exercise', labelKey: 'habits.subject.exercise' },
  { slug: 'quit_drinking', labelKey: 'habits.subject.quitDrinking' },
  { slug: 'custom', labelKey: 'habits.subject.custom' },
];

const envelope = <T>(data: T) => ({ data, error: null });

export const handlers = [
  http.get('http://localhost:8080/v1/areas/with-projects', () => HttpResponse.json(envelope([]))),
  // Registered before /attachments so the literal path wins over the list route.
  http.get('http://localhost:8080/v1/attachments/usage', () =>
    HttpResponse.json(envelope({ usedBytes: 0, limitBytes: 100 * 1024 * 1024 }))
  ),
  // TaskDialog lists attachments for whatever task it opens; without a default
  // any suite that opens the dialog logs an unhandled-request warning.
  // A bare array, matching the API — GET /attachments returns AttachmentView[],
  // not a wrapped { items }. The old { items: [] } default only looked correct
  // because an empty list and a malformed one render identically.
  http.get('http://localhost:8080/v1/attachments', () => HttpResponse.json(envelope([]))),
  // Project notes (E-053). Empty by default so any surface that mounts the notes
  // list gets a well-formed empty response; suites override per-case.
  http.get('http://localhost:8080/v1/notes/:id', ({ params }) =>
    HttpResponse.json(envelope(makeNoteDetail({ id: String(params.id) })))
  ),
  // Paginated response shape — { items, nextCursor }. Suites override per-case.
  http.get('http://localhost:8080/v1/notes', () => HttpResponse.json(envelope({ items: [], nextCursor: '' }))),
  // Habits (E-055). Literal paths before the :id wildcard, or /habits/today
  // resolves as a habit whose id is "today".
  http.get('http://localhost:8080/v1/habits/today', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/habits/subjects', () => HttpResponse.json(envelope(mockHabitSubjects))),
  http.get('http://localhost:8080/v1/habits/:id', ({ params }) =>
    HttpResponse.json(envelope(makeHabitDetail({ id: String(params.id) })))
  ),
  http.get('http://localhost:8080/v1/habits', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/projects', () => HttpResponse.json(envelope([]))),
  // Paginated response shape — { items, nextCursor }. Suites override per-case.
  http.get('http://localhost:8080/v1/projects/:projectId/tasks', () =>
    HttpResponse.json(envelope({ items: [], nextCursor: '' }))
  ),
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
    HttpResponse.json(envelope({ tasks: [], projects: [], areas: [], notes: [] }))
  ),
  // Default AI quota: a Pro user well under the monthly cap, so surfaces that
  // merely mount the chat aren't walled. Suites override per-case.
  http.get('http://localhost:8080/v1/ai/usage', () =>
    HttpResponse.json(envelope({ used: 12, limit: 500, scope: 'month', month: '2026-07' }))
  ),
  // AI session messages pagination — empty history, no older pages to load.
  // Suites that need paginated history override with server.use(...) per-test.
  http.get('http://localhost:8080/v1/ai/sessions/:id/messages', () =>
    HttpResponse.json(envelope({ items: [], nextCursor: '' }))
  ),
  // Google Calendar overlay (E-052): a connected account with no events, so any
  // surface that renders the calendar gets a well-formed empty overlay instead
  // of an unhandled request. Suites that care override per-case.
  http.get('http://localhost:8080/v1/calendar/google-events', () =>
    HttpResponse.json(envelope({ events: [], googleStatus: 'ok' }))
  ),
  http.get('http://localhost:8080/v1/calendar/google/calendars', () => HttpResponse.json(envelope([]))),
];
