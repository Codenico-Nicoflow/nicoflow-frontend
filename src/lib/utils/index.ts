import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { IconId } from './utils/schemas';
export { ICON_IDS } from './utils/schemas';
export {
  bucketSchema,
  createAreaSchema,
  forgotPasswordSchema,
  loginSchema,
  processBucketSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateAreaSchema,
} from './utils/schemas';

// Form data types
export type {
  AreaFormData,
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
  getApiErrorCode,
  getProjectStatusColor,
  iconLabel,
  isDateInPast,
  isErrorWithMessage,
  isFetchBaseQueryError,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
  type Toast,
} from './utils/helpers';
export { ToastMessages } from './utils/messages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// A Date or an ISO date string → its timestamp; anything else → null. Lets us
// compare a form's Date value against an entity's ISO-string value (the common
// edit-form case) by time, so equal dates in different shapes aren't "changed".
function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && value.includes('T')) {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

// null, undefined, and '' are all "no value" — a cleared field shouldn't read as
// changed just because the form models empty as '' while the entity uses null.
const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === '';

function fieldChanged(originalValue: unknown, currentValue: unknown): boolean {
  const origEmpty = isEmpty(originalValue);
  const currEmpty = isEmpty(currentValue);
  if (origEmpty || currEmpty) return origEmpty !== currEmpty;

  // Dates: compare by timestamp even when one side is a Date and the other an
  // ISO string (e.g. form Date vs entity string).
  const origTime = toTimestamp(originalValue);
  const currTime = toTimestamp(currentValue);
  if (origTime !== null && currTime !== null) return origTime !== currTime;

  if (typeof originalValue === 'object' && typeof currentValue === 'object') {
    return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
  }

  return originalValue !== currentValue;
}

export function detectFormChanges<T extends object>(
  originalData: T,
  currentData: Partial<T>,
  fieldsToCompare?: (keyof T)[]
): boolean {
  const fields = fieldsToCompare ?? (Object.keys(originalData) as (keyof T)[]);
  return fields.some(key => fieldChanged(originalData[key], currentData[key]));
}

export function hasFormChanges<T extends object>(
  isEditMode: boolean,
  originalData: T | null | undefined,
  currentData: Partial<T>,
  fieldsToCompare?: (keyof T)[]
): boolean {
  if (!isEditMode || !originalData) return true;

  return detectFormChanges(originalData, currentData, fieldsToCompare);
}
