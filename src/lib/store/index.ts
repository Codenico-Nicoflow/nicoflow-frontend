import {
  aiApi,
  areaApi,
  attachmentApi,
  authApi,
  bucketApi,
  focusSessionApi,
  googleCalendarApi,
  habitApi,
  nlpApi,
  noteApi,
  notificationApi,
  projectApi,
  recurrenceApi,
  searchApi,
  subtaskApi,
  taskApi,
} from './store';

// Store exports
export type { AppDispatch, RootState } from './store';
export {
  aiApi,
  areaApi,
  attachmentApi,
  authApi,
  bucketApi,
  focusSessionApi,
  googleCalendarApi,
  habitApi,
  nlpApi,
  noteApi,
  notificationApi,
  persistor,
  projectApi,
  recurrenceApi,
  searchApi,
  store,
  subtaskApi,
  taskApi,
  webTokenStorage,
} from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';

// Store utils
export { invalidateApiTags } from './utils/invalidateTags';

// The only sanctioned refresh entry point outside baseQuery (shares its single-
// flight mutex). Used by the WebSocket hook on a 1008 close.
export { refreshSessionFromStore } from './slices/baseQuery';

// Auth exports — hooks are generated on the instance constructed in store.ts
export const {
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
} = authApi;
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
} from '@nicoflow/shared/api';

// Project exports
export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectQuery,
  useGetProjectsQuery,
  useReorderProjectsMutation,
  useUpdateProjectMutation,
} = projectApi;
export type {
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from '@nicoflow/shared/api';

// Area exports
export const {
  useCreateAreaMutation,
  useDeleteAreaMutation,
  useGetAreaQuery,
  useGetAreasQuery,
  useGetAreasWithProjectsQuery,
  useReorderAreasMutation,
  useUpdateAreaMutation,
} = areaApi;
export type {
  CreateAreaRequest,
  CreateAreaResponse,
  UpdateAreaRequest,
  UpdateAreaResponse,
} from '@nicoflow/shared/api';

// Task exports
export const {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetCalendarTasksQuery,
  useGetFocusQuery,
  useGetTaskQuery,
  useGetTasksInfiniteQuery,
  useGetTimeSpreadQuery,
  useMarkTaskMissedMutation,
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} = taskApi;
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
} from '@nicoflow/shared/api';

// Subtask exports
export const { useCreateSubtaskMutation, useDeleteSubtaskMutation, useGetSubtasksQuery, useUpdateSubtaskMutation } =
  subtaskApi;

// Bucket exports
export const {
  useCreateBucketMutation,
  useDeleteBucketMutation,
  useGetBucketQuery,
  useGetBucketsQuery,
  useProcessBucketMutation,
  useUpdateBucketMutation,
} = bucketApi;
export type {
  BucketResponse,
  BucketsResponse,
  CreateBucketDto,
  NoteDetails,
  ProcessBucketDto,
  TaskDetails,
  UpdateBucketDto,
} from '@nicoflow/shared/api';

// Rate-limit exports
export type { RateLimitState } from './slices/rateLimit/rateLimitSlice';
export { clearRateLimit, selectRateLimitRetryAt, setRateLimited } from './slices/rateLimit/rateLimitSlice';

// Search exports
export const { useSearchQuery } = searchApi;
export type { IAreaResult, INoteResult, IProjectResult, ISearchResults, ITaskResult } from '@nicoflow/shared/api';

// Attachment exports
export const {
  useConfirmAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
  useGetDownloadUrlMutation,
  useGetStorageUsageQuery,
  useGetUploadUrlMutation,
} = attachmentApi;
export type {
  ConfirmAttachmentRequest,
  ConfirmAttachmentResponse,
  GetAttachmentsRequest,
  GetAttachmentsResponse,
  GetDownloadUrlResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from '@nicoflow/shared/api';

// Recurrence exports (E-050)
export const {
  useConvertTaskToRecurringMutation,
  useCreateRecurrenceRuleMutation,
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRuleQuery,
  useGetRecurrenceRulesQuery,
  useGetRecurrenceStatsQuery,
  usePauseRecurrenceRuleMutation,
  useUpdateRecurrenceRuleMutation,
} = recurrenceApi;
export type {
  ConvertToRecurringRequest,
  CreateRecurrenceRuleRequest,
  ListRecurrenceRulesRequest,
  ListRecurrenceRulesResponse,
  PauseRecurrenceRuleRequest,
  RecurrenceSchedule,
  RecurrenceStatsResponse,
  UpdateRecurrenceRuleRequest,
} from '@nicoflow/shared/api';

// Focus session exports (E-049)
export { focusWsEvent, selectFocusLive } from './slices/focusSession/focusLiveSlice';
export const { useCloseFocusSessionMutation, useFocusHeartbeatMutation, useOpenFocusSessionMutation } = focusSessionApi;
export type { FocusLiveEvent, OpenFocusSessionRequest } from '@nicoflow/shared/api';

// Note exports (E-053)
export const {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetBacklinksQuery,
  useGetNoteQuery,
  useGetNotesInfiniteQuery,
  useLazySearchMentionsQuery,
  useUpdateNoteMutation,
} = noteApi;
export type {
  CreateNoteRequest,
  IMentionResult,
  ListNotesPage,
  ListNotesRequest,
  SearchMentionsRequest,
  UpdateNoteRequest,
} from '@nicoflow/shared/api';

// Habit exports (E-055)
export const {
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
} = habitApi;
export type { CheckInRequest, CreateHabitRequest, UndoCheckInRequest, UpdateHabitRequest } from '@nicoflow/shared/api';

// NLP date-text parsing exports (NIC-1931/1932)
export const { useParseNLPDateMutation } = nlpApi;
export type { NLPDateLocale, ParseNLPDateRequest, ParseNLPDateResponse } from '@nicoflow/shared/api';

// Notification exports
export const {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetPreferencesQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useUpdatePreferencesMutation,
} = notificationApi;
export type {
  GetNotificationsRequest,
  GetNotificationsResponse,
  GetPreferencesResponse,
  PushSubscribeRequest,
  PushUnsubscribeRequest,
  UnreadCountResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from '@nicoflow/shared/api';

// AI exports
export const {
  useCreateAISessionMutation,
  useDeleteAISessionMutation,
  useGetAISessionQuery,
  useGetAISessionsQuery,
  useGetAIUsageQuery,
  useGetSessionMessagesInfiniteQuery,
  useListPendingToolCallsQuery,
} = aiApi;
export type {
  CreateAISessionRequest,
  CreateAISessionResponse,
  GetAISessionResponse,
  GetAISessionsResponse,
  GetAIUsageResponse,
  GetSessionMessagesPage,
  GetSessionMessagesRequest,
  ListPendingToolCallsResponse,
} from '@nicoflow/shared/api';

// Google Calendar overlay exports (E-052)
export const {
  useDisconnectGoogleMutation,
  useGetGoogleCalendarsQuery,
  useGetGoogleConnectionQuery,
  useGetGoogleEventsQuery,
  useLazyGetGoogleAuthUrlQuery,
  useUpdateGoogleCalendarSelectionMutation,
} = googleCalendarApi;
export type {
  GetGoogleEventsRequest,
  GoogleConnectResponse,
  GoogleEventsResponse,
  GoogleStatus,
  IGoogleCalendar,
  IGoogleConnection,
  IGoogleEvent,
} from '@nicoflow/shared/api';
export { MAX_SELECTED_CALENDARS } from '@nicoflow/shared/api';
