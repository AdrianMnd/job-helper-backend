import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth } from './auth';
import { env } from '../config/env';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('requireAuth', () => {
  it('rechaza si falta el header Authorization', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza un token invalido', () => {
    const req: any = { headers: { authorization: 'Bearer token-falso' } };
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('con un token valido, adjunta el usuario al request y llama a next()', () => {
  const token = jwt.sign({ userId: 'u1', email: 'a@a.com' }, env.jwtSecret);
  const req: any = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  const next = vi.fn();

  requireAuth(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(req.user).toMatchObject({ userId: 'u1', email: 'a@a.com' });
});
});