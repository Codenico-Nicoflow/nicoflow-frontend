import { type FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { ToastMessages } from './messages';

/**
 * Toast interface for cross-platform compatibility
 * Works with Sonner (web) and can be extended for mobile (Expo/React Native)
 */
export interface Toast {
  error: (message: string) => void | string | number;
  success: (message: string) => void | string | number;
}

/**
 * Type predicate to narrow an unknown error to `FetchBaseQueryError`
 */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Type predicate to narrow an unknown error to an object with a string 'message' property
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error != null && 'message' in error && typeof error.message === 'string';
}

export function showErrorToast(err: unknown, toast: Toast) {
  let text: string;

  if (isFetchBaseQueryError(err)) {
    if ('error' in err && typeof err.error === 'string') {
      text = ToastMessages[err.error as keyof typeof ToastMessages] || ToastMessages.GENERAL_ERROR;
    } else if ('data' in err) {
      const code =
        typeof err.data === 'object' && err.data !== null && 'error' in err.data ? err.data.error : undefined;
      text =
        code && ToastMessages[code as keyof typeof ToastMessages]
          ? ToastMessages[code as keyof typeof ToastMessages]
          : ToastMessages.GENERAL_ERROR;
    } else {
      text = ToastMessages.GENERAL_ERROR;
    }
  } else if (isErrorWithMessage(err)) {
    text = ToastMessages[err.message as keyof typeof ToastMessages] || ToastMessages.GENERAL_ERROR;
  } else if (typeof err === 'string') {
    text = ToastMessages[err as keyof typeof ToastMessages] || ToastMessages.GENERAL_ERROR;
  } else {
    text = ToastMessages.GENERAL_ERROR;
  }

  toast.error(text);
}

export function showSuccessToast(msg: string, toast: Toast) {
  const text = ToastMessages[msg as keyof typeof ToastMessages] || msg;
  return toast.success(text);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isDateInPast(date: Date) {
  const today = new Date();
  today.setHours(1, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Prepare optional fields for backend submission
 * - Numeric/Date/Object fields → null when cleared
 * - String fields → empty string '' when cleared
 */
export function prepareOptionalFields<T extends Record<string, string | number | boolean | null | undefined>>(
  data: T,
  stringFields: string[] = []
): Partial<T> {
  const result: Partial<T> = {};

  Object.keys(data).forEach(key => {
    const value = data[key];

    // Skip undefined values
    if (value === undefined) {
      return;
    }

    // Handle null - convert based on field type
    if (value === null) {
      result[key as keyof T] = (stringFields.includes(key) ? '' : null) as T[keyof T];
      return;
    }

    // Keep the value as is
    result[key as keyof T] = value as T[keyof T];
  });

  return result;
}
