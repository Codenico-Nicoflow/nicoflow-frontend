// Store exports
export type { AppDispatch, RootState } from './store';
export { persistor, store } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';

// Store utils
export { invalidateApiTags } from './utils/invalidateTags';

// Auth exports
export { authApi } from './slices/auth/authApi';
export {
  useForgotPasswordMutation,
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
  useResendVerificationMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
} from './slices/auth/authApi';
export { clearAuth, setToken, setUser } from './slices/auth/authSlice';
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

// Area exports
export { areaApi } from './slices/area/areaApi';
export {
  useCreateAreaMutation,
  useDeleteAreaMutation,
  useGetAreaQuery,
  useGetAreasQuery,
  useGetAreasWithProjectsQuery,
  useUpdateAreaMutation,
} from './slices/area/areaApi';
export type { CreateAreaRequest, CreateAreaResponse, UpdateAreaRequest, UpdateAreaResponse } from './slices/area/type';

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

// Bucket exports
export { bucketApi } from './slices/bucket/bucketApi';
export {
  useCreateBucketMutation,
  useDeleteBucketMutation,
  useGetBucketQuery,
  useGetBucketsQuery,
  useProcessBucketMutation,
  useUpdateBucketMutation,
} from './slices/bucket/bucketApi';
export type {
  BucketResponse,
  BucketsResponse,
  CreateBucketDto,
  NoteDetails,
  ProcessBucketDto,
  TaskDetails,
  UpdateBucketDto,
} from './slices/bucket/type';
