import { describe, expect, it } from 'vitest';

import {
  ATTACHMENT_ALLOWED_MIME_TYPES,
  ATTACHMENT_MAX_BYTES,
  isAllowedAttachmentMime,
  isAllowedAttachmentSize,
  validateAttachmentFile,
} from './attachment';

const makeFile = (type: string, size: number): File => {
  const file = new File(['x'], 'f', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('attachment MIME allowlist', () => {
  it('accepts every allowed type', () => {
    for (const mime of ATTACHMENT_ALLOWED_MIME_TYPES) {
      expect(isAllowedAttachmentMime(mime)).toBe(true);
    }
  });

  it('rejects SVG (script-carrying)', () => {
    expect(isAllowedAttachmentMime('image/svg+xml')).toBe(false);
  });

  it('rejects an unknown type', () => {
    expect(isAllowedAttachmentMime('application/x-msdownload')).toBe(false);
  });
});

describe('attachment size gate', () => {
  it('rejects zero / negative bytes', () => {
    expect(isAllowedAttachmentSize(0)).toBe(false);
    expect(isAllowedAttachmentSize(-1)).toBe(false);
  });

  it('accepts up to the 20 MB cap and rejects one byte over', () => {
    expect(isAllowedAttachmentSize(ATTACHMENT_MAX_BYTES)).toBe(true);
    expect(isAllowedAttachmentSize(ATTACHMENT_MAX_BYTES + 1)).toBe(false);
  });
});

describe('validateAttachmentFile', () => {
  it('returns null for an allowed, in-range file', () => {
    expect(validateAttachmentFile(makeFile('application/pdf', 1024))).toBeNull();
  });

  it('flags a disallowed MIME first', () => {
    expect(validateAttachmentFile(makeFile('image/svg+xml', 1024))).toBe('MIME_NOT_ALLOWED');
  });

  it('flags an empty file as EMPTY_FILE, not SIZE_EXCEEDED', () => {
    expect(validateAttachmentFile(makeFile('application/pdf', 0))).toBe('EMPTY_FILE');
  });

  it('flags an oversize file', () => {
    expect(validateAttachmentFile(makeFile('application/pdf', ATTACHMENT_MAX_BYTES + 1))).toBe('SIZE_EXCEEDED');
  });
});
