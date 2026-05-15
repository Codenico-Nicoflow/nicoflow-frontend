import { describe, expect, it, vi } from 'vitest';

import {
  capitalize,
  isDateInPast,
  isErrorWithMessage,
  isFetchBaseQueryError,
  prepareOptionalFields,
  showErrorToast,
  showSuccessToast,
} from './helpers';

const mockToast = { error: vi.fn(), success: vi.fn() };

describe('isFetchBaseQueryError', () => {
  it('returns true for object with status property', () => {
    expect(isFetchBaseQueryError({ status: 400, data: {} })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isFetchBaseQueryError(null)).toBe(false);
  });

  it('returns false for plain string', () => {
    expect(isFetchBaseQueryError('error')).toBe(false);
  });

  it('returns false for object without status', () => {
    expect(isFetchBaseQueryError({ message: 'oops' })).toBe(false);
  });
});

describe('isErrorWithMessage', () => {
  it('returns true for object with string message', () => {
    expect(isErrorWithMessage({ message: 'something went wrong' })).toBe(true);
  });

  it('returns false for object with non-string message', () => {
    expect(isErrorWithMessage({ message: 42 })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isErrorWithMessage(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isErrorWithMessage('error')).toBe(false);
  });
});

describe('showErrorToast', () => {
  it('shows GENERAL_ERROR for unknown error shape', () => {
    showErrorToast({}, mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('shows GENERAL_ERROR for FetchBaseQueryError with data but unknown code', () => {
    showErrorToast({ status: 500, data: { error: 'UNKNOWN_CODE' } }, mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('resolves known FetchBaseQueryError data error code to ToastMessages', () => {
    showErrorToast({ status: 401, data: { error: 'UNAUTHORIZED' } }, mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('You are not authorized to perform this action.');
  });

  it('resolves FetchBaseQueryError with string error field', () => {
    showErrorToast({ status: 'FETCH_ERROR', error: 'GENERAL_ERROR' }, mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('shows toast for plain string error key', () => {
    showErrorToast('INVALID_CREDENTIALS', mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('Invalid email or password.');
  });

  it('shows GENERAL_ERROR for unrecognised string', () => {
    showErrorToast('TOTALLY_UNKNOWN', mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('resolves isErrorWithMessage shape to ToastMessages key', () => {
    showErrorToast({ message: 'USER_NOT_FOUND' }, mockToast);
    expect(mockToast.error).toHaveBeenCalledWith('User not found. Please check your credentials.');
  });
});

describe('showSuccessToast', () => {
  it('resolves known key to ToastMessages value', () => {
    showSuccessToast('PROJECT_CREATED', mockToast);
    expect(mockToast.success).toHaveBeenCalledWith('Project created successfully!');
  });

  it('passes through unknown string as-is', () => {
    showSuccessToast('Custom message', mockToast);
    expect(mockToast.success).toHaveBeenCalledWith('Custom message');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles already-capitalized string', () => {
    expect(capitalize('World')).toBe('World');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('isDateInPast', () => {
  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDateInPast(yesterday)).toBe(true);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDateInPast(tomorrow)).toBe(false);
  });

  it('returns false for today', () => {
    expect(isDateInPast(new Date())).toBe(false);
  });
});

describe('prepareOptionalFields', () => {
  it('keeps defined values as-is', () => {
    const result = prepareOptionalFields({ name: 'test', count: 5 });
    expect(result).toEqual({ name: 'test', count: 5 });
  });

  it('skips undefined values', () => {
    const result = prepareOptionalFields({ name: 'test', missing: undefined });
    expect(result).not.toHaveProperty('missing');
  });

  it('converts null to null for non-string fields', () => {
    const result = prepareOptionalFields({ count: null });
    expect(result.count).toBeNull();
  });

  it('converts null to empty string for declared string fields', () => {
    const result = prepareOptionalFields({ description: null }, ['description']);
    expect(result.description).toBe('');
  });

  it('handles boolean values', () => {
    const result = prepareOptionalFields({ active: true, disabled: false });
    expect(result).toEqual({ active: true, disabled: false });
  });
});
