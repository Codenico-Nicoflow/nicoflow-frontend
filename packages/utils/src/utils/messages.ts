export const ToastMessages = {
  // ✅ Success messages
  SIGN_IN_SUCCESSFULLY: 'Signed in successfully!',
  SIGN_UP_SUCCESSFULLY: 'Signed up successfully!',
  PASSWORD_CHANGED_SUCCESSFULLY: 'Password changed successfully!',
  LOGGED_OUT_SUCCESSFULLY: 'You have been logged out.',
  LOGGED_OUT_ALL_DEVICES_SUCCESSFULLY: 'Logged out from all devices.',
  PASSWORD_RESET_EMAIL_SENT_SUCCESSFULLY: 'Password reset email sent successfully!',

  PROJECT_DELETED: 'Project deleted successfully!',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_ARCHIVED: 'Project archived successfully!',
  PROJECT_COMPLETED: 'Project completed successfully!',
  PROJECT_MOVED: 'Project moved successfully!',

  TASK_UPDATED_SUCCESSFULLY: 'Task updated successfully!',
  TASK_CREATED_SUCCESSFULLY: 'Task created successfully!',
  TASK_DELETED_SUCCESSFULLY: 'Task deleted successfully!',

  CATEGORY_CREATED: 'Category created successfully!',
  CATEGORY_UPDATED: 'Category updated successfully!',
  CATEGORY_DELETED: 'Category deleted successfully!',

  BUCKET_CREATED: 'Bucket item created successfully!',
  BUCKET_UPDATED: 'Bucket item updated successfully!',
  BUCKET_DELETED: 'Bucket item deleted successfully!',
  BUCKET_PROCESSED_TASK: 'Bucket item processed into task successfully!',
  // ✅ Authentication & User Error messages
  INVALID_REFRESH_TOKEN: 'Your session has expired. Please log in again.',
  USER_NOT_FOUND: 'User not found. Please check your credentials.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  USER_EXISTS: 'A user with this email already exists.',
  INVALID_PASSWORD: 'Password is invalid.',
  PASSWORDS_CANNOT_MATCH: 'New password cannot match the old one.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token.',
  INVALID_EMAIL: 'Invalid email address.',

  // ✅ Username validation errors
  USERNAME_EXISTS: 'This username is already taken.',
  USERNAME_MUST_BE_STRING: 'Username must be a valid string.',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long.',
  USERNAME_TOO_LONG: 'Username cannot exceed 30 characters.',
  USERNAME_INVALID_FORMAT: 'Username contains invalid characters.',
  USERNAME_RULE_ERROR: 'Username must be at least 3 characters, letters and numbers only (no special chars)',

  // ✅ Password validation errors
  PASSWORD_RULE_ERROR: 'Password must be at least 8 characters, at least one uppercase, one lowercase',

  // ✅ Project errors
  PROJECT_ALREADY_EXISTS: 'A project with this name already exists.',
  PROJECT_NOT_FOUND: 'Project not found.',
  PROJECT_NAME_REQUIRED: 'Project name is required.',
  PROJECT_NAME_ALREADY_EXISTS: 'Project name already exists.',
  PROJECT_RULE_ERROR: 'Project name contains invalid characters.',
  PROJECT_GROUP_TOO_LONG: 'Project group name is too long.',
  PROJECT_ICON_TOO_LONG: 'Project icon name is too long.',
  PROJECT_DUE_DATE_INVALID: 'Project due date is invalid.',
  PROJECT_DUE_DATE_PAST: 'Project due date cannot be in the past.',
  PROJECT_STATUS_INVALID: 'Project status is invalid.',
  PROJECT_SORT_ORDER_INVALID: 'Project sort order is invalid.',
  PROJECT_NAME_MUST_BE_STRING: 'Project name must be a valid string.',
  PROJECT_NAME_TOO_SHORT: 'Project name is too short.',
  PROJECT_NAME_TOO_LONG: 'Project name is too long.',

  // ✅ Task errors
  TASK_STATUS_INVALID: 'Task status is invalid.',
  TASK_STATUS_NOT_FOUND: 'Task status not found.',
  TASK_STATUS_NOT_VALID: 'Task status is not valid.',
  TASK_STATUS_NOT_ALLOWED: 'Task status is not allowed.',
  TASK_NAME_REQUIRED: 'Task name is required.',
  TASK_DESCRIPTION_REQUIRED: 'Task description is required',

  // ✅ Rate limiting errors
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  LOGIN_ATTEMPTS_EXCEEDED: 'Too many login attempts. Please try again later.',
  REGISTRATION_ATTEMPTS_EXCEEDED: 'Too many registration attempts. Please try again later.',
  PASSWORD_RESET_ATTEMPTS_EXCEEDED: 'Too many password reset attempts. Please try again later.',
  PROFILE_ACCESS_LIMIT_EXCEEDED: 'Too many profile access attempts. Please try again later.',

  // ✅ General errors
  UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
  GENERAL_ERROR: 'Server error. Please try again later.',
  INVALID_DROP_TARGET: 'Invalid drop target.',
} as const;
