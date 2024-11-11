import { createMocks } from 'node-mocks-http';
import type { NextApiRequest } from 'next';
import type { MockResponse } from 'node-mocks-http';
import handler from '@/app/api/security-monitor/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('security-monitor API', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/security-monitor', () => {
    it('アクセスログの取得に成功する', async () => {
      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'GET',
      });

      const mockLogs = [
        {
          id: 1,
          userId: 'user1',
          accessTime: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          endpoint: '/api/users',
        }
      ];

      mockSupabase.select.mockResolvedValueOnce({ data: mockLogs, error: null });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ logs: mockLogs });
    });

    it('不正アクセスアラートの取得に成功する', async () => {
      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'GET',
        query: { type: 'alerts' },
      });

      const mockAlerts = [
        {
          id: 1,
          userId: 'user1',
          type: 'suspicious_login',
          riskScore: 0.8,
          timestamp: new Date().toISOString(),
          details: { location: 'Unknown', attempts: 5 },
        }
      ];

      mockSupabase.select.mockResolvedValueOnce({ data: mockAlerts, error: null });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ alerts: mockAlerts });
    });
  });

  describe('POST /api/security-monitor', () => {
    it('新規アクセスログの記録に成功する', async () => {
      const accessLog = {
        userId: 'user1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/users',
      };

      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'POST',
        body: accessLog,
      });

      mockSupabase.insert.mockResolvedValueOnce({ data: { id: 1, ...accessLog }, error: null });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toHaveProperty('id');
    });

    it('不正アクセス検知時にアラートが生成される', async () => {
      const suspiciousAccess = {
        userId: 'user1',
        ipAddress: '192.168.1.1',
        userAgent: 'Unknown',
        endpoint: '/api/users',
        attempts: 10,
      };

      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'POST',
        body: suspiciousAccess,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [{ attempts: 5 }],
        error: null,
      });

      mockSupabase.insert.mockResolvedValueOnce({
        data: { id: 1, type: 'suspicious_access', riskScore: 0.9 },
        error: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toHaveProperty('alert');
    });
  });

  describe('エラーハンドリング', () => {
    it('DBエラー時に500エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'GET',
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });

    it('無効なリクエストメソッドで405エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      });
    });

    it('不正なリクエストボディで400エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'POST',
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });

  describe('リスクスコア計算', () => {
    it('通常のアクセスパターンで低リスクスコアを返す', async () => {
      const normalAccess = {
        userId: 'user1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/users',
        attempts: 1,
      };

      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'POST',
        body: normalAccess,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [{ attempts: 1 }],
        error: null,
      });

      await handler(req, res);

      const response = JSON.parse(res._getData());
      expect(response.riskScore).toBeLessThan(0.5);
    });

    it('不審なアクセスパターンで高リスクスコアを返す', async () => {
      const suspiciousAccess = {
        userId: 'user1',
        ipAddress: 'unknown',
        userAgent: 'Unknown',
        endpoint: '/api/admin',
        attempts: 20,
      };

      const { req, res } = createMocks<NextApiRequest, MockResponse>({
        method: 'POST',
        body: suspiciousAccess,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [{ attempts: 15 }],
        error: null,
      });

      await handler(req, res);

      const response = JSON.parse(res._getData());
      expect(response.riskScore).toBeGreaterThan(0.7);
    });
  });
});