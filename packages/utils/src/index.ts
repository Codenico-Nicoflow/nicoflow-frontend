// Utility exports
export type { IconId } from './utils/schemas';
export { ICON_IDS } from './utils/schemas';
export {
  loginSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  projectSchema,
  createCategorySchema,
  updateCategorySchema,
} from './utils/schemas';

// Form data types
export type {
  LoginFormData,
  ForgotPasswordFormData,
  RegisterFormData,
  ResetPasswordFormData,
  ProjectFormData,
} from './utils/schemas';

// Utils exports
export { ICON_IMPORTS } from './utils/get-icons';
export {
  isFetchBaseQueryError,
  isErrorWithMessage,
  showErrorToast,
  showSuccessToast,
  capitalize,
  isDateInPast,
} from './utils/helpers';
export { ToastMessages } from './utils/messages';
