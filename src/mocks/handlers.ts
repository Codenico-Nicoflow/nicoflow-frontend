import { http, HttpResponse } from 'msw';

import type { IUser } from '@/lib/types';

export const mockUser: IUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  theme: 'light',
  imageUrl: '',
  status: 'regular',
};

export const mockAuthResponse = {
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
};

const envelope = <T>(data: T) => ({ data, error: null });

export const handlers = [
  http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/projects', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/tasks', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/bucket', () => HttpResponse.json(envelope([]))),
  http.get('http://localhost:8080/v1/users/profile', () => HttpResponse.json(envelope(mockUser))),

  http.post('http://localhost:8080/v1/auth/login', () => HttpResponse.json(envelope(mockAuthResponse))),
  http.post('http://localhost:8080/v1/auth/register', () => HttpResponse.json(envelope(mockAuthResponse))),
  http.post('http://localhost:8080/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.post('http://localhost:8080/v1/auth/refresh-token', () =>
    HttpResponse.json(envelope({ ...mockAuthResponse, token: 'new-mock-access-token' }))
  ),
  http.post('http://localhost:8080/v1/auth/forgot-password', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/reset-password', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/verify-email', () => HttpResponse.json(envelope(null))),
  http.post('http://localhost:8080/v1/auth/resend-verification', () => HttpResponse.json(envelope(null))),
];
