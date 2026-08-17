// Factory functions — one per domain
export { createAiApi } from './ai';
export { createAreaApi } from './area';
export { createAttachmentApi } from './attachment';
export { createAuthApi } from './auth';
export { createBucketApi } from './bucket';
export { createFocusSessionApi } from './focus-session';
export { createGoogleCalendarApi } from './google-calendar';
export { createHabitApi } from './habit';
export { createNlpApi } from './nlp';
export { createNoteApi } from './note';
export { createNotificationApi } from './notification';
export { createProjectApi } from './project';
export { createRecurrenceApi } from './recurrence';
export { createSearchApi } from './search';
export { createSubtaskApi } from './subtasks';
export { createTaskApi } from './tasks';

// Shared base query type
export type { ApiBaseQuery } from './area';

// Platform adapters (token storage, WS lifecycle) — see adapters.ts
export type { TokenStorage, WSLifecycleAdapter } from './adapters';

// Cross-slice dependency types (auth needs its action creators injected;
// project needs the constructed areaApi instance injected)
export type { AuthActions } from './auth';
export type { AreaApi } from './project';

// Auth types (from the existing auth.types.ts)
export type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyEmailRequest,
  VerifyResetTokenRequest,
  VerifyResetTokenResponse,
} from './auth.types';

// AI types
export type {
  AIMessageRole,
  AIMessageView,
  AIPendingToolCall,
  AISessionDetailView,
  AISessionView,
  AIToolName,
  AIUsageScope,
  AIUsageView,
  CreateAISessionRequest,
  CreateAISessionResponse,
  GetAISessionResponse,
  GetAISessionsResponse,
  GetAIUsageResponse,
  GetSessionMessagesPage,
  GetSessionMessagesRequest,
  ListPendingToolCallsResponse,
} from './ai.types';

// Area types
export type {
  AreaWithProjects,
  CreateAreaRequest,
  CreateAreaResponse,
  DeleteAreaResponse,
  GetAllAreasResponse,
  GetAreaRequest,
  GetAreaResponse,
  GetAreasWithProjectsResponse,
  ReorderAreaItem,
  ReorderAreasRequest,
  ReorderAreasResponse,
  UpdateAreaRequest,
  UpdateAreaResponse,
} from './area.types';

// Attachment types
export type {
  ConfirmAttachmentRequest,
  ConfirmAttachmentResponse,
  GetAttachmentsRequest,
  GetAttachmentsResponse,
  GetDownloadUrlResponse,
  GetStorageUsageResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from './attachment.types';

// Bucket types
export type {
  BucketResponse,
  BucketsResponse,
  CreateBucketDto,
  NoteDetails,
  ProcessBucketDto,
  TaskDetails,
  UpdateBucketDto,
} from './bucket.types';

// Focus-session types
export type {
  CloseFocusSessionResponse,
  FocusLiveEvent,
  OpenFocusSessionRequest,
  OpenFocusSessionResponse,
} from './focus-session.types';

// Google Calendar types
export type {
  GetGoogleEventsRequest,
  GoogleConnectResponse,
  GoogleEventsResponse,
  GoogleResponseStatus,
  GoogleStatus,
  IGoogleCalendar,
  IGoogleConnection,
  IGoogleEvent,
} from './google-calendar.types';
export { MAX_SELECTED_CALENDARS } from './google-calendar.types';

// Habit types
export type { CheckInRequest, CreateHabitRequest, UndoCheckInRequest, UpdateHabitRequest } from './habit.types';

// Note types
export type { CreateNoteRequest, ListNotesPage, ListNotesRequest, UpdateNoteRequest } from './note.types';

// NLP types
export type { NLPDateLocale, ParseNLPDateRequest, ParseNLPDateResponse } from './nlp.types';

// Notification types
export type {
  CountResponse,
  DeleteNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsResponse,
  GetPreferencesResponse,
  MarkReadRequest,
  MarkReadResponse,
  PushSubscribeRequest,
  PushUnsubscribeRequest,
  UnreadCountResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from './notification.types';

// Project types
export type {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  DeleteProjectResponse,
  GetProjectRequest,
  GetProjectResponse,
  GetProjectsResponse,
  ReorderProjectItem,
  ReorderProjectsRequest,
  ReorderProjectsResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from './project.types';

// Recurrence types
export type {
  CreateRecurrenceRuleRequest,
  IRecurrenceRule,
  IRecurrenceStats,
  ListRecurrenceRulesRequest,
  ListRecurrenceRulesResponse,
  PauseRecurrenceRuleRequest,
  RecurrenceSchedule,
  RecurrenceStatsResponse,
  UpdateRecurrenceRuleRequest,
} from './recurrence.types';

// Search types
export type { IAreaResult, INoteResult, IProjectResult, ISearchResults, ITaskResult } from './search.types';

// Subtask types
export type {
  CreateSubtaskRequest,
  CreateSubtaskResponse,
  DeleteSubtaskRequest,
  DeleteSubtaskResponse,
  GetSubtasksRequest,
  GetSubtasksResponse,
  UpdateSubtaskRequest,
  UpdateSubtaskResponse,
} from './subtasks.types';

// Task types
export type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  GetCalendarTasksRequest,
  GetCalendarTasksResponse,
  GetFocusRequest,
  GetFocusResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTasksPage,
  GetTasksRequest,
  GetTimeSpreadResponse,
  MarkTaskMissedRequest,
  MarkTaskMissedResponse,
  ReorderTaskRequest,
  ReorderTaskResponse,
  ScheduleTaskRequest,
  ScheduleTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  UpdateTaskStatusRequest,
  UpdateTaskStatusResponse,
} from './tasks.types';
