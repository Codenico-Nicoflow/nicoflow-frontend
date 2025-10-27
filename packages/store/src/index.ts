// Store exports
export type { AppDispatch, RootState } from './store';
export { store } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';

// Auth exports
export { authApi } from './slices/auth/authApi';
export {
  useForgotPasswordMutation,
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
  useResetPasswordMutation,
} from './slices/auth/authApi';
export { clearAuth, setUser } from './slices/auth/authSlice';
export { selectUser } from './slices/auth/authSlice';
export { selectIsLoading } from './slices/auth/authSlice';
export { selectAuth } from './slices/auth/authSlice';
export type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from './slices/auth/type';

// Project exports
export { projectApi } from './slices/project/projectApi';
export {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectQuery,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from './slices/project/projectApi';
export type {
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from './slices/project/type';

// Category exports
export { categoryApi } from './slices/category/categoryApi';
export {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetCategoriesWithProjectsQuery,
  useGetCategoryQuery,
  useUpdateCategoryMutation,
} from './slices/category/categoryApi';
export type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from './slices/category/type';

// Task exports
export { taskApi } from './slices/tasks/taskApi';
export {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTaskQuery,
  useGetTasksQuery,
  useUpdateTaskMutation,
} from './slices/tasks/taskApi';
export type { CreateTaskRequest, CreateTaskResponse, UpdateTaskRequest, UpdateTaskResponse } from './slices/tasks/type';

// API endpoints
export { BUCKET_API, CATEGORY_API, PROJECT_API, TASKS_API } from './api/endpoints';
