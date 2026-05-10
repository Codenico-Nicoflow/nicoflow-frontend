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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectFormChanges<T extends object>(
  originalData: T,
  currentData: Partial<T>,
  fieldsToCompare?: (keyof T)[]
): boolean {
  const fields = fieldsToCompare || (Object.keys(originalData) as (keyof T)[]);

  return fields.some(key => {
    const originalValue = originalData[key] as unknown;
    const currentValue = currentData[key] as unknown;

    if (originalValue instanceof Date && currentValue instanceof Date) {
      return originalValue.getTime() !== currentValue.getTime();
    }

    if (
      typeof originalValue === 'string' &&
      typeof currentValue === 'string' &&
      (originalValue.includes('T') || currentValue.includes('T'))
    ) {
      try {
        const origDate = new Date(originalValue);
        const currDate = new Date(currentValue);
        if (!isNaN(origDate.getTime()) && !isNaN(currDate.getTime())) {
          return origDate.getTime() !== currDate.getTime();
        }
      } catch {
        return originalValue !== currentValue;
      }
    }

    if (
      (originalValue === null || originalValue === undefined) &&
      (currentValue === null || currentValue === undefined)
    ) {
      return false;
    }

    if (
      typeof originalValue === 'object' &&
      typeof currentValue === 'object' &&
      originalValue !== null &&
      currentValue !== null &&
      !(originalValue instanceof Date) &&
      !(currentValue instanceof Date)
    ) {
      return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    }

    return originalValue !== currentValue;
  });
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
