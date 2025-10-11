// Store exports
export type { AppDispatch, RootState } from './store';
export { store } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector } from './hooks';

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

// API endpoints
export { CATEGORY_API, PROJECT_API } from './api/endpoints';
