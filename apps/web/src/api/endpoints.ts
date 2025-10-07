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
