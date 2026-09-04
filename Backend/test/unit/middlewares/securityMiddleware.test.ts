/**
 * Security Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  securityHeaders,
  noCacheAuth,
  abortDetection,
} from '../../../src/middlewares/securityMiddleware';

describe('Security Middleware', () => {
  function createMockReqRes() {
    const req: Partial<Request> = {
      on: jest.fn(),
    };
    const res: Partial<Response> = {
      setHeader: jest.fn(),
      set: jest.fn(),
    };
    const next: NextFunction = jest.fn();
    return { req: req as Request, res: res as Response, next };
  }

  describe('securityHeaders', () => {
    it('deve setar X-Content-Type-Options', () => {
      const { req, res, next } = createMockReqRes();
      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('deve setar X-Frame-Options', () => {
      const { req, res, next } = createMockReqRes();
      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('deve setar Referrer-Policy', () => {
      const { req, res, next } = createMockReqRes();
      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
    });

    it('deve setar Permissions-Policy', () => {
      const { req, res, next } = createMockReqRes();
      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
    });

    it('deve chamar next()', () => {
      const { req, res, next } = createMockReqRes();
      securityHeaders(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('noCacheAuth', () => {
    it('deve setar Cache-Control no-store', () => {
      const { req, res, next } = createMockReqRes();
      noCacheAuth(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
      );
    });

    it('deve setar Pragma no-cache', () => {
      const { req, res, next } = createMockReqRes();
      noCacheAuth(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
    });

    it('deve chamar next()', () => {
      const { req, res, next } = createMockReqRes();
      noCacheAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('abortDetection', () => {
    it('deve registrar listeners no request', () => {
      const { req, res, next } = createMockReqRes();
      abortDetection(req, res, next);

      expect(req.on).toHaveBeenCalledWith('aborted', expect.any(Function));
      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('deve expor método isAborted()', () => {
      const { req, res, next } = createMockReqRes();
      abortDetection(req, res, next);

      expect((req as any).isAborted).toBeDefined();
      expect(typeof (req as any).isAborted).toBe('function');
      expect((req as any).isAborted()).toBe(false);
    });

    it('deve chamar next()', () => {
      const { req, res, next } = createMockReqRes();
      abortDetection(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
