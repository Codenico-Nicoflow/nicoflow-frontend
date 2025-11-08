export const AUTH_API = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  GET_CURRENT_USER: '/users/profile',
};

export const PROJECT_API = {
  GET_PROJECTS: '/projects',
  GET_PROJECT: '/projects/',
  CREATE_PROJECT: '/projects',
  UPDATE_PROJECT: '/projects/',
  DELETE_PROJECT: '/projects/',
};

export const CATEGORY_API = {
  GET_CATEGORIES: '/categories',
  GET_CATEGORIES_WITH_PROJECTS: '/categories/with-projects',
  GET_CATEGORY: '/categories/',
  CREATE_CATEGORY: '/categories',
  UPDATE_CATEGORY: '/categories/',
  DELETE_CATEGORY: '/categories/',
};

export const TASKS_API = {
  GET_TASKS: '/tasks',
  GET_TASK: '/tasks/',
  CREATE_TASK: '/tasks',
  UPDATE_TASK: '/tasks/',
  DELETE_TASK: '/tasks/',
};

export const BUCKET_API = {
  GET_BUCKETS: '/bucket',
  GET_BUCKET: '/bucket/',
  CREATE_BUCKET: '/bucket',
  UPDATE_BUCKET: '/bucket/',
  DELETE_BUCKET: '/bucket/',
};
