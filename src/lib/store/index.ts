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
  useGetCalendarTasksQuery,
  useGetFocusQuery,
  useGetTaskQuery,
  useGetTasksInfiniteQuery,
  useGetTimeSpreadQuery,
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from './slices/tasks/taskApi';
export type {
  CreateTaskRequest,
  CreateTaskResponse,
  GetCalendarTasksRequest,
  GetCalendarTasksResponse,
  GetFocusRequest,
  GetTasksPage,
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
  NoteDetails,
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
export type { IAreaResult, INoteResult, IProjectResult, ISearchResults, ITaskResult } from './slices/search/type';

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

// Focus session exports (E-049)
export { focusWsEvent, selectFocusLive } from './slices/focusSession/focusLiveSlice';
export { focusSessionApi } from './slices/focusSession/focusSessionApi';
export {
  useCloseFocusSessionMutation,
  useFocusHeartbeatMutation,
  useOpenFocusSessionMutation,
} from './slices/focusSession/focusSessionApi';
export type { FocusLiveEvent, OpenFocusSessionRequest } from './slices/focusSession/type';

// Note exports (E-053)
export { noteApi } from './slices/note/noteApi';
export {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetNoteQuery,
  useGetNotesInfiniteQuery,
  useUpdateNoteMutation,
} from './slices/note/noteApi';
export type { CreateNoteRequest, ListNotesPage, ListNotesRequest, UpdateNoteRequest } from './slices/note/type';

// Habit exports (E-055)
export { habitApi } from './slices/habit/habitApi';
export {
  useArchiveHabitMutation,
  useCheckInMutation,
  useCreateHabitMutation,
  useDeleteHabitMutation,
  useGetHabitQuery,
  useGetHabitsQuery,
  useGetHabitsTodayQuery,
  useGetHabitSubjectsQuery,
  useRestoreHabitMutation,
  useUndoCheckInMutation,
  useUpdateHabitMutation,
} from './slices/habit/habitApi';
export type { CheckInRequest, CreateHabitRequest, UndoCheckInRequest, UpdateHabitRequest } from './slices/habit/type';

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
  useGetSessionMessagesInfiniteQuery,
  useListPendingToolCallsQuery,
} from './slices/ai/aiApi';
export type {
  CreateAISessionRequest,
  CreateAISessionResponse,
  GetAISessionResponse,
  GetAISessionsResponse,
  GetAIUsageResponse,
  GetSessionMessagesPage,
  GetSessionMessagesRequest,
  ListPendingToolCallsResponse,
} from './slices/ai/type';

// Google Calendar overlay exports (E-052)
export { googleCalendarApi } from './slices/googleCalendar/googleCalendarApi';
export {
  useDisconnectGoogleMutation,
  useGetGoogleCalendarsQuery,
  useGetGoogleConnectionQuery,
  useGetGoogleEventsQuery,
  useLazyGetGoogleAuthUrlQuery,
  useUpdateGoogleCalendarSelectionMutation,
} from './slices/googleCalendar/googleCalendarApi';
export type {
  GetGoogleEventsRequest,
  GoogleConnectResponse,
  GoogleEventsResponse,
  GoogleStatus,
  IGoogleCalendar,
  IGoogleConnection,
  IGoogleEvent,
} from './slices/googleCalendar/type';
export { MAX_SELECTED_CALENDARS } from './slices/googleCalendar/type';
