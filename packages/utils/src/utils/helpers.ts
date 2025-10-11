import { type FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { ToastMessages } from './messages';

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

export function showErrorToast(err: unknown, toast: any) {
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

export function showSuccessToast(msg: string, toast: any) {
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
