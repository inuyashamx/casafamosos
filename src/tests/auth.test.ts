import request from 'supertest';
import { createServer } from 'http';
import { GET as authHandler } from '../app/api/auth/[...nextauth]/route';

describe('NextAuth Login Endpoint', () => {
  it('debería responder con 200, 302 o 401 en GET', async () => {
    const server = createServer((req, res) => authHandler(req as any, res as any));
    const response = await request(server).get('/api/auth');
    expect([200, 302, 401]).toContain(response.statusCode); // NextAuth puede redirigir o pedir login
  });
}); 