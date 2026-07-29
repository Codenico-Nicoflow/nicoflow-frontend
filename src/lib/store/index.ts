// Store exports
export type { AppDispatch, RootState } from './store';
export { persistor, store } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';

// Store utils
export { invalidateApiTags } from './utils/invalidateTags';

// The only sanctioned refresh entry point outside baseQuery (shares its single-
// flight mutex). Used by the WebSocket hook on a 1008 close.
export { refreshSessionFromStore } from './slices/baseQuery';

// Auth exports
export { authApi } from './slices/auth/authApi';
export {
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutAllMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
  useResendVerificationMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
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
  useReorderProjectsMutation,
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
  useReorderAreasMutation,
  useUpdateAreaMutation,
} from './slices/area/areaApi';
export type { CreateAreaRequest, CreateAreaResponse, UpdateAreaRequest, UpdateAreaResponse } from './slices/area/type';

// Task exports
export { taskApi } from './slices/tasks/taskApi';
export {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetFocusQuery,
  useGetTaskQuery,
  useGetTasksQuery,
  useGetTimeSpreadQuery,
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from './slices/tasks/taskApi';
export type {
  CreateTaskRequest,
  CreateTaskResponse,
  GetFocusRequest,
  GetTimeSpreadResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from './slices/tasks/type';

// Subtask exports
export { subtaskApi } from './slices/subtasks/subtaskApi';
export {
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useUpdateSubtaskMutation,
} from './slices/subtasks/subtaskApi';

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
  ProcessBucketDto,
  TaskDetails,
  UpdateBucketDto,
} from './slices/bucket/type';

// Rate-limit exports
export type { RateLimitState } from './slices/rateLimit/rateLimitSlice';
export { clearRateLimit, selectRateLimitRetryAt, setRateLimited } from './slices/rateLimit/rateLimitSlice';

// Search exports
export { searchApi } from './slices/search/searchApi';
export { useSearchQuery } from './slices/search/searchApi';
export type { IAreaResult, IProjectResult, ISearchResults, ITaskResult } from './slices/search/type';

// Attachment exports
export { attachmentApi } from './slices/attachment/attachmentApi';
export {
  useConfirmAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
  useGetDownloadUrlMutation,
  useGetStorageUsageQuery,
  useGetUploadUrlMutation,
} from './slices/attachment/attachmentApi';
export type {
  ConfirmAttachmentRequest,
  ConfirmAttachmentResponse,
  GetAttachmentsRequest,
  GetAttachmentsResponse,
  GetDownloadUrlResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from './slices/attachment/type';

// Recurrence exports (E-050)
export { recurrenceApi } from './slices/recurrence/recurrenceApi';
export {
  useCreateRecurrenceRuleMutation,
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRuleQuery,
  useGetRecurrenceRulesQuery,
  useGetRecurrenceStatsQuery,
  usePauseRecurrenceRuleMutation,
  useUpdateRecurrenceRuleMutation,
} from './slices/recurrence/recurrenceApi';
export type {
  CreateRecurrenceRuleRequest,
  ListRecurrenceRulesRequest,
  ListRecurrenceRulesResponse,
  PauseRecurrenceRuleRequest,
  RecurrenceSchedule,
  RecurrenceStatsResponse,
  UpdateRecurrenceRuleRequest,
} from './slices/recurrence/type';

// Notification exports
export { notificationApi } from './slices/notification/notificationApi';
export {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetPreferencesQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useUpdatePreferencesMutation,
} from './slices/notification/notificationApi';
export type {
  GetNotificationsRequest,
  GetNotificationsResponse,
  GetPreferencesResponse,
  PushSubscribeRequest,
  PushUnsubscribeRequest,
  UnreadCountResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from './slices/notification/type';

// AI exports
export { aiApi } from './slices/ai/aiApi';
export {
  useCreateAISessionMutation,
  useDeleteAISessionMutation,
  useGetAISessionQuery,
  useGetAISessionsQuery,
  useGetAIUsageQuery,
} from './slices/ai/aiApi';
export type {
  CreateAISessionRequest,
  CreateAISessionResponse,
  GetAISessionResponse,
  GetAISessionsResponse,
  GetAIUsageResponse,
} from './slices/ai/type';
