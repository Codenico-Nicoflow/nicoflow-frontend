// Utility exports
export type { IconId } from './utils/schemas';
export { ICON_IDS } from './utils/schemas';
export {
  bucketSchema,
  createCategorySchema,
  forgotPasswordSchema,
  loginSchema,
  processBucketSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateCategorySchema,
} from './utils/schemas';

// Form data types
export type {
  BucketFormData,
  ForgotPasswordFormData,
  LoginFormData,
  ProcessBucketFormData,
  ProjectFormData,
  RegisterFormData,
  ResetPasswordFormData,
  TaskFormData,
} from './utils/schemas';

// Utils exports
export { ICON_IMPORTS } from './utils/get-icons';
export {
  capitalize,
  isDateInPast,
  isErrorWithMessage,
  isFetchBaseQueryError,
  showErrorToast,
  showSuccessToast,
  type Toast,
} from './utils/helpers';
export { ToastMessages } from './utils/messages';
