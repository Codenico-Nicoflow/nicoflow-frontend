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
  GET_CATEGORIES: '/Categories',
  GET_CATEGORIES_WITH_PROJECTS: '/Categories/with-projects',
  GET_CATEGORY: '/Categories/',
  CREATE_CATEGORY: '/Categories',
  UPDATE_CATEGORY: '/Categories/',
  DELETE_CATEGORY: '/Categories/',
};

export const TASKS_API = {
  GET_TASKS: '/Tasks',
  GET_TASK: '/Tasks/',
  CREATE_TASK: '/Tasks',
  UPDATE_TASK: '/Tasks/',
  DELETE_TASK: '/Tasks/',
};

export const BUCKET_API = {
  GET_BUCKETS: '/Bucket',
  GET_BUCKET: '/Bucket/',
  CREATE_BUCKET: '/Bucket',
  UPDATE_BUCKET: '/Bucket/',
  DELETE_BUCKET: '/Bucket/',
};
