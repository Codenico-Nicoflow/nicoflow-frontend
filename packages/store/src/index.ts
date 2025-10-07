// Store exports
export { store, persistor } from './store';
export type { RootState, AppDispatch } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';

// Auth exports
export { authApi } from './slices/auth/authApi';
export { setUser, setIsLoading, clearAuth } from './slices/auth/authSlice';
export {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} from './slices/auth/authApi';
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './slices/auth/type';

// Project exports
export { projectApi } from './slices/project/projectApi';
export {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
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
  useGetCategoriesQuery,
  useGetCategoriesWithProjectsQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from './slices/category/categoryApi';
export type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from './slices/category/type';

// API endpoints
export { AUTH_API, PROJECT_API, CATEGORY_API } from './api/endpoints';
