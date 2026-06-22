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

// Extracts the error code string from whatever shape arrives.
// Priority order:
// 1. Unwrapped backend envelope: { error: { code, message } }  — from transformErrorResponse: e => e.data
// 2. FetchBaseQueryError with data envelope: { status, data: { error: { code } } }
// 3. FetchBaseQueryError with string error field (network errors)
// 4. Plain string
// 5. { message: string }
export function getApiErrorCode(err: unknown): string | undefined {
  if (err === null || typeof err !== 'object') {
    return typeof err === 'string' ? err : undefined;
  }

  const obj = err as Record<string, unknown>;

  // Shape 1: unwrapped envelope { error: { code } } — most common via transformErrorResponse
  if (typeof obj['error'] === 'object' && obj['error'] !== null) {
    const inner = obj['error'] as Record<string, unknown>;
    if (typeof inner['code'] === 'string') return inner['code'];
  }

  // Shape 2: FetchBaseQueryError { status, data: { error: { code } } }
  if ('status' in obj && typeof obj['data'] === 'object' && obj['data'] !== null) {
    const data = obj['data'] as Record<string, unknown>;
    if (typeof data['error'] === 'object' && data['error'] !== null) {
      const inner = data['error'] as Record<string, unknown>;
      if (typeof inner['code'] === 'string') return inner['code'];
    }
    // Fallback: data.error is a plain string code
    if (typeof data['error'] === 'string') return data['error'];
  }

  // Shape 3: FetchBaseQueryError network error { status: 'FETCH_ERROR', error: string }
  if ('status' in obj && typeof obj['error'] === 'string') return obj['error'];

  // Shape 4: { message: string }
  if (typeof obj['message'] === 'string') return obj['message'];

  return undefined;
}

export function showErrorToast(err: unknown, toast: Toast) {
  const code = getApiErrorCode(err);
  const text =
    code && code in ToastMessages ? ToastMessages[code as keyof typeof ToastMessages] : ToastMessages.GENERAL_ERROR;
  toast.error(text);
}

export function showSuccessToast(msg: string, toast: Toast) {
  const text = ToastMessages[msg as keyof typeof ToastMessages] || msg;
  return toast.success(text);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Badge classes for a project status, shared by the board, row and detail header.
export function getProjectStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function isDateInPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
