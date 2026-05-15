import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:8080/v1/areas', () => HttpResponse.json([])),
  http.get('http://localhost:8080/v1/projects', () => HttpResponse.json([])),
  http.get('http://localhost:8080/v1/tasks', () => HttpResponse.json([])),
  http.get('http://localhost:8080/v1/bucket', () => HttpResponse.json([])),
  http.post('http://localhost:8080/v1/auth/login', () => HttpResponse.json({ token: 'mock-token' }, { status: 200 })),
  http.post('http://localhost:8080/v1/auth/refresh-token', () =>
    HttpResponse.json({ token: 'new-mock-token' }, { status: 200 })
  ),
];
