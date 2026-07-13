export const AUTH_API = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
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
