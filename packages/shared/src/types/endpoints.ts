export const AUTH_API = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  LOGOUT: '/auth/logout',
  LOGOUT_ALL: '/auth/logout-all',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  GET_CURRENT_USER: '/users/profile',
  UPDATE_PROFILE: '/users/me',
};

export const PROJECT_API = {
  GET_PROJECTS: '/projects',
  GET_PROJECT: '/projects/',
  // POST /v1/areas/:areaId/projects — caller appends `${areaId}/projects`
  CREATE_PROJECT_IN_AREA: '/areas/',
  UPDATE_PROJECT: '/projects/',
  DELETE_PROJECT: '/projects/',
  REORDER_PROJECTS: '/projects/reorder',
};

export const AREA_API = {
  GET_AREAS: '/areas',
  GET_AREAS_WITH_PROJECTS: '/areas/with-projects',
  GET_AREA: '/areas/',
  CREATE_AREA: '/areas',
  UPDATE_AREA: '/areas/',
  DELETE_AREA: '/areas/',
  REORDER_AREAS: '/areas/reorder',
};

export const TASKS_API = {
  GET_TASKS: '/tasks',
  GET_TASK: '/tasks/',
  CREATE_TASK: '/tasks',
  UPDATE_TASK: '/tasks/',
  DELETE_TASK: '/tasks/',
};

// Subtasks are nested under a task: /tasks/:taskId/subtasks[/:subtaskId].
export const SUBTASK_API = {
  subtasks: (taskId: string) => `/tasks/${taskId}/subtasks`,
  subtask: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}`,
};

export const BUCKET_API = {
  GET_BUCKETS: '/bucket',
  GET_BUCKET: '/bucket/',
  CREATE_BUCKET: '/bucket',
  UPDATE_BUCKET: '/bucket/',
  DELETE_BUCKET: '/bucket/',
};

export const SEARCH_API = {
  SEARCH: '/search',
};

// Focus timer sessions (E-049). One open segment per user, so close/heartbeat
// address "current" rather than an id.
export const FOCUS_SESSION_API = {
  OPEN: '/focus/sessions',
  CLOSE: '/focus/sessions/current/close',
  HEARTBEAT: '/focus/sessions/current/heartbeat',
};

// Attachments are polymorphic-flat: owner is a {ownerType, ownerId} query pair,
// never nested under the task. `${id}/download-url` and the DELETE take the id.
export const ATTACHMENT_API = {
  UPLOAD_URL: '/attachments/upload-url', // POST → { url, fields, s3Key }
  CONFIRM: '/attachments', // POST { s3Key, fileName } → AttachmentView
  LIST: '/attachments', // GET ?ownerType=&ownerId= → AttachmentView[]
  USAGE: '/attachments/usage', // GET → { usedBytes, limitBytes } (whole account)
  DOWNLOAD_URL: '/attachments/', // + `${id}/download-url` (GET) → { url }
  DELETE: '/attachments/', // + id (DELETE) → 204
};

// Recurrence rules (E-050). Creation is nested under the owning project; every
// other verb is flat on the rule id.
export const RECURRENCE_API = {
  CREATE: '/projects/', // + `${projectId}/recurrence-rules` (POST) → IRecurrenceRule
  LIST: '/recurrence-rules', // GET ?projectId= → { items }
  DETAIL: '/recurrence-rules/', // + id (GET | PATCH | DELETE)
  PAUSE: '/recurrence-rules/', // + `${id}/pause` (PATCH { paused })
  STATS: '/recurrence-rules/', // + `${id}/stats` (GET) → IRecurrenceStats
};

// Project notes (E-053). Routes are flat and top-level, like /attachments — the
// project is a query param on list, never a path segment.
export const NOTE_API = {
  LIST: '/notes', // GET ?projectId= → NoteView[]
  CREATE: '/notes', // POST → NoteDetailView (201)
  DETAIL: '/notes/', // + id (GET → NoteDetailView | PATCH → 200/409 | DELETE → 204)
};

export const HABIT_API = {
  LIST: '/habits', // GET ?includeArchived= → HabitView[]
  CREATE: '/habits', // POST → HabitView (201)
  DETAIL: '/habits/', // + id (GET → HabitDetailView | PATCH → 200 | DELETE → 204)
  CHECK_IN: '/check-in', // appended to DETAIL + id (POST checks in, DELETE undoes)
  TODAY: '/habits/today', // GET → HabitView[] still owed right now
  SUBJECTS: '/habits/subjects', // GET → SubjectView[] (static catalog)
};

export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/notifications',
  GET_UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: '/notifications/', // + `${id}/read` (PATCH)
  MARK_ALL_READ: '/notifications/read-all',
  DELETE_NOTIFICATION: '/notifications/', // + id (DELETE)
  GET_PREFERENCES: '/notifications/preferences',
  UPDATE_PREFERENCES: '/notifications/preferences',
  PUSH_SUBSCRIBE: '/notifications/push/subscribe', // POST subscribe · DELETE unsubscribe
};

export const AI_API = {
  SESSIONS: '/ai/sessions', // GET list · POST create
  SESSION: '/ai/sessions/', // + id (GET detail · DELETE)
  USAGE: '/ai/usage', // GET quota state
  MESSAGES: (id: string) => `/ai/sessions/${id}/messages`, // POST send (SSE over POST)
  TOOL_CALLS: (sessionId: string) => `/ai/sessions/${sessionId}/tool-calls`, // GET ?status=pending
};

// Stateless date parsing (NIC-1931). No cache tag — fire-and-forget.
export const NLP_API = {
  PARSE_DATE: '/nlp/parse-date',
};

export const GOOGLE_CALENDAR_API = {
  CONNECT: '/calendar/google/connect', // GET → { authUrl }
  CONNECTION: '/calendar/google/connection', // GET connection · DELETE disconnect
  CALENDARS: '/calendar/google/calendars', // GET list · PUT selection
  EVENTS: '/calendar/google-events', // GET ?from=&to=&refresh= → { events, googleStatus }
};
