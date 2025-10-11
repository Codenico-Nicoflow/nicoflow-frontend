// Utility exports
export type { IconId } from './utils/schemas';
export { ICON_IDS } from './utils/schemas';
export {
  createCategorySchema,
  forgotPasswordSchema,
  loginSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  updateCategorySchema,
} from './utils/schemas';

// Form data types
export type {
  ForgotPasswordFormData,
  LoginFormData,
  ProjectFormData,
  RegisterFormData,
  ResetPasswordFormData,
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
} from './utils/helpers';
export { ToastMessages } from './utils/messages';
