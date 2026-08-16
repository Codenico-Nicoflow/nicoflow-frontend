import { describe, expect, it } from 'vitest';

import {
  bucketSchema,
  changePasswordSchema,
  createAreaSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  projectSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  updateAreaSchema,
} from './index';

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
    expect(result.error?.issues[0]?.message).toBe('validation.identifierRequired');
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
    expect(result.error?.issues[0]?.message).toBe('validation.usernameMin');
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
    expect(result.error?.issues[0]?.message).toBe('validation.passwordUppercase');
  });

  it('rejects a password with no lowercase letter', () => {
    const result = registerSchema.safeParse({ username: 'codenico', email: 'user@example.com', password: 'PASSWORD1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.passwordLowercase');
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
    expect(result.error?.issues[0]?.message).toBe('validation.emailInvalid');
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
    expect(result.error?.issues[0]?.message).toBe('validation.passwordsNoMatch');
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
    expect(result.error?.issues[0]?.message).toBe('validation.projectNameRequired');
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
    expect(result.error?.issues[0]?.message).toBe('validation.statusInvalid');
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
    expect(result.error?.issues[0]?.message).toBe('validation.descriptionMax');
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
    expect(result.error?.issues[0]?.message).toBe('validation.colorInvalid');
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
    energy: 'medium' as const,
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
    expect(result.error?.issues[0]?.message).toBe('validation.priorityInvalid');
  });

  it('accepts a valid energy', () => {
    const result = taskSchema.safeParse({ ...validTask, energy: 'deep' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid energy', () => {
    const result = taskSchema.safeParse({ ...validTask, energy: 'extreme' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.energyInvalid');
  });

  it('accepts the cancelled status', () => {
    const result = taskSchema.safeParse({ ...validTask, status: 'cancelled' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status', () => {
    const result = taskSchema.safeParse({ ...validTask, status: 'someday' });
    expect(result.success).toBe(false);
  });

  it('accepts an ISO date string scheduledFor', () => {
    const result = taskSchema.safeParse({ ...validTask, scheduledFor: '2026-05-02' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid url', () => {
    const result = taskSchema.safeParse({ ...validTask, url: 'not-a-url' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.urlInvalid');
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

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'oldpass', newPassword: 'NewPass1', confirmPassword: 'NewPass1' };

  it('parses a valid change with matching passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty current password', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.passwordRequired');
  });

  it('enforces the new-password policy (needs upper + lower, 8+ chars)', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'short', confirmPassword: 'short' }).success).toBe(
      false
    );
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'alllower1', confirmPassword: 'alllower1' }).success
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'ALLUPPER1', confirmPassword: 'ALLUPPER1' }).success
    ).toBe(false);
  });

  it('rejects when confirm does not match new', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.passwordsNoMatch');
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('rejects when the new password equals the current one', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'NewPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find(i => i.path[0] === 'newPassword');
    expect(issue?.message).toBe('validation.newPasswordSameAsCurrent');
  });
});

describe('profileSchema', () => {
  it('parses valid first + last name', () => {
    expect(profileSchema.safeParse({ firstName: 'Jane', lastName: 'Doe' }).success).toBe(true);
  });

  it('allows an empty last name', () => {
    expect(profileSchema.safeParse({ firstName: 'Jane', lastName: '' }).success).toBe(true);
  });

  it('rejects an empty first name', () => {
    const result = profileSchema.safeParse({ firstName: '  ', lastName: 'Doe' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('validation.firstNameRequired');
  });

  it('rejects a first name over 50 chars', () => {
    const result = profileSchema.safeParse({ firstName: 'a'.repeat(51), lastName: 'Doe' });
    expect(result.success).toBe(false);
  });
});
