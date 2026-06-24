import { describe, expect, it } from 'vitest';

import {
  bucketSchema,
  createAreaSchema,
  forgotPasswordSchema,
  loginSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateAreaSchema,
} from './schemas';

describe('loginSchema', () => {
  it('parses valid credentials with an email identifier', () => {
    const result = loginSchema.safeParse({ identifier: 'user@example.com', password: 'Password1', remember: false });
    expect(result.success).toBe(true);
  });

  it('parses valid credentials with a username identifier', () => {
    const result = loginSchema.safeParse({ identifier: 'codenico', password: 'Password1', remember: false });
    expect(result.success).toBe(true);
  });

  it('rejects an empty identifier', () => {
    const result = loginSchema.safeParse({ identifier: '   ', password: 'Password1', remember: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/email or username/i);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ identifier: 'user@example.com', password: '', remember: false });
    expect(result.success).toBe(false);
  });

  // Login must NOT enforce the password composition policy — an existing
  // account with any stored password must still be able to sign in.
  it('accepts a short/legacy password at the login gate', () => {
    const result = loginSchema.safeParse({ identifier: 'user@example.com', password: 'old', remember: false });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('parses valid registration data', () => {
    const result = registerSchema.safeParse({ username: 'codenico', email: 'user@example.com', password: 'Password1' });
    expect(result.success).toBe(true);
  });

  it('rejects username shorter than 3 chars', () => {
    const result = registerSchema.safeParse({ username: 'ab', email: 'user@example.com', password: 'Password1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/at least 3/i);
  });

  it('rejects username with special characters', () => {
    const result = registerSchema.safeParse({
      username: 'user@name',
      email: 'user@example.com',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects username longer than 20 chars', () => {
    const result = registerSchema.safeParse({
      username: 'a'.repeat(21),
      email: 'user@example.com',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password with no uppercase letter', () => {
    const result = registerSchema.safeParse({ username: 'codenico', email: 'user@example.com', password: 'password1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/uppercase/i);
  });

  it('rejects a password with no lowercase letter', () => {
    const result = registerSchema.safeParse({ username: 'codenico', email: 'user@example.com', password: 'PASSWORD1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/lowercase/i);
  });

  it('rejects a password under 8 chars', () => {
    const result = registerSchema.safeParse({ username: 'codenico', email: 'user@example.com', password: 'Ab1' });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('parses valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/valid email/i);
  });

  it('rejects empty string', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('parses when passwords match', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'Password1', confirmPassword: 'Password1' });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'Password1', confirmPassword: 'Password2' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/do not match/i);
  });
});

describe('projectSchema', () => {
  it('parses valid project data', () => {
    const result = projectSchema.safeParse({
      name: 'My Project',
      areaId: 'abc-123',
      folderIcon: 'folder',
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = projectSchema.safeParse({ name: '', areaId: 'abc-123', folderIcon: 'folder', status: 'active' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/required/i);
  });

  it('rejects name over 50 chars', () => {
    const result = projectSchema.safeParse({
      name: 'a'.repeat(51),
      areaId: 'abc-123',
      folderIcon: 'folder',
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty areaId', () => {
    const result = projectSchema.safeParse({ name: 'Project', areaId: '', folderIcon: 'folder', status: 'active' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      areaId: 'abc-123',
      folderIcon: 'folder',
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a description up to 2000 chars', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      areaId: 'abc-123',
      folderIcon: 'folder',
      status: 'active',
      description: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a description over 2000 chars (R9)', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      areaId: 'abc-123',
      folderIcon: 'folder',
      status: 'active',
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/2000/);
  });
});

describe('createAreaSchema', () => {
  it('parses valid area', () => {
    const result = createAreaSchema.safeParse({ name: 'Work', icon: 'briefcase' });
    expect(result.success).toBe(true);
  });

  it('defaults icon to briefcase when omitted', () => {
    const result = createAreaSchema.safeParse({ name: 'Work' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.icon).toBe('briefcase');
  });

  it('rejects empty name', () => {
    const result = createAreaSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 30 chars', () => {
    const result = createAreaSchema.safeParse({ name: 'a'.repeat(31) });
    expect(result.success).toBe(false);
  });

  it('accepts a valid 6-digit hex color', () => {
    const result = createAreaSchema.safeParse({ name: 'Work', color: '#c4622d', icon: 'briefcase' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-hex color before submit (R7)', () => {
    const result = createAreaSchema.safeParse({ name: 'Work', color: 'red', icon: 'briefcase' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/hex color/i);
  });

  it('rejects a 3-digit shorthand hex color', () => {
    const result = createAreaSchema.safeParse({ name: 'Work', color: '#fff', icon: 'briefcase' });
    expect(result.success).toBe(false);
  });
});

describe('updateAreaSchema', () => {
  it('accepts partial update with only name', () => {
    const result = updateAreaSchema.safeParse({ name: 'Personal' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only icon', () => {
    const result = updateAreaSchema.safeParse({ icon: 'folder' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateAreaSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('taskSchema', () => {
  const validTask = {
    title: 'Fix bug',
    priority: 'medium' as const,
  };

  it('parses valid task', () => {
    const result = taskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = taskSchema.safeParse({ ...validTask, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 255 chars', () => {
    const result = taskSchema.safeParse({ ...validTask, title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = taskSchema.safeParse({ ...validTask, priority: 'urgent' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid url', () => {
    const result = taskSchema.safeParse({ ...validTask, url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts empty string url', () => {
    const result = taskSchema.safeParse({ ...validTask, url: '' });
    expect(result.success).toBe(true);
  });

  it('accepts estimatedMinutes within range', () => {
    const result = taskSchema.safeParse({ ...validTask, estimatedMinutes: 60 });
    expect(result.success).toBe(true);
  });

  it('rejects estimatedMinutes over 1440', () => {
    const result = taskSchema.safeParse({ ...validTask, estimatedMinutes: 1441 });
    expect(result.success).toBe(false);
  });
});

describe('bucketSchema', () => {
  it('parses valid bucket content', () => {
    const result = bucketSchema.safeParse({ content: 'Remember to buy milk' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = bucketSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content over 500 chars', () => {
    const result = bucketSchema.safeParse({ content: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });
});
