/**
 * Date Converter Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { dateConverterMiddleware } from '../../../src/middlewares/dateConverterMiddleware';

describe('Date Converter Middleware', () => {
  function createMockReqRes() {
    const capturedBody: { value: unknown } = { value: null };
    const originalJson = jest.fn((body: unknown) => {
      capturedBody.value = body;
    }) as any;
    const req: Partial<Request> = {};
    const res: Partial<Response> = {
      json: originalJson,
    };
    const next: NextFunction = jest.fn();
    return { req: req as Request, res: res as Response, next, capturedBody };
  }

  it('deve converter Date para string ISO-8601', () => {
    const { req, res, next, capturedBody } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    const date = new Date('2025-01-15T12:00:00Z');
    res.json!({ createdAt: date });

    expect(capturedBody.value).toEqual({
      createdAt: date.toISOString(),
    });
  });

  it('deve converter Dates aninhados em objetos', () => {
    const { req, res, next, capturedBody } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    const date = new Date('2025-06-20T10:30:00Z');
    res.json!({
      user: {
        name: 'Test',
        profile: {
          lastLogin: date,
        },
      },
    });

    expect(capturedBody.value).toEqual({
      user: {
        name: 'Test',
        profile: {
          lastLogin: date.toISOString(),
        },
      },
    });
  });

  it('deve converter Dates em arrays', () => {
    const { req, res, next, capturedBody } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    const d1 = new Date('2025-01-01T00:00:00Z');
    const d2 = new Date('2025-12-31T23:59:59Z');
    res.json!([{ date: d1 }, { date: d2 }]);

    expect(capturedBody.value).toEqual([
      { date: d1.toISOString() },
      { date: d2.toISOString() },
    ]);
  });

  it('deve preservar valores não-Date', () => {
    const { req, res, next, capturedBody } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    res.json!({
      id: 1,
      name: 'Test',
      active: true,
      score: 3.14,
      tags: ['a', 'b'],
      meta: null,
    });

    expect(capturedBody.value).toEqual({
      id: 1,
      name: 'Test',
      active: true,
      score: 3.14,
      tags: ['a', 'b'],
      meta: null,
    });
  });

  it('deve tratar null e undefined', () => {
    const { req, res, next, capturedBody } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    res.json!({ a: null, b: undefined });

    expect(capturedBody.value).toEqual({ a: null });
  });

  it('deve chamar next()', () => {
    const { req, res, next } = createMockReqRes();

    dateConverterMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
