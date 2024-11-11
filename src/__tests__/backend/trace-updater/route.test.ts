import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import handleTraceUpdate from '@/app/api/trace-updater/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
}

describe('流通履歴更新API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTraceData = {
    productId: 'prod_123',
    location: '東京都倉庫',
    status: '保管中',
    timestamp: '2024-01-15T10:00:00Z',
    temperature: 20,
    humidity: 55,
  };

  it('正常な流通履歴更新リクエストを処理できる', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: mockTraceData,
    });

    const mockSupabase = createClient as jest.Mock;
    mockSupabase.mockImplementation(() => ({
      from: () => ({
        update: jest.fn().mockResolvedValue({ data: mockTraceData, error: null }),
        select: jest.fn().mockResolvedValue({ data: [mockTraceData], error: null }),
      }),
    }));

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: mockTraceData,
    });
  });

  it('必須パラメータが欠けている場合にエラーを返す', async () => {
    const invalidData = {
      productId: 'prod_123',
      // locationが欠けている
      status: '保管中',
    };

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: invalidData,
    });

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'location は必須パラメータです',
    });
  });

  it('不正な製品IDの場合にエラーを返す', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: { ...mockTraceData, productId: 'invalid_id' },
    });

    const mockSupabase = createClient as jest.Mock;
    mockSupabase.mockImplementation(() => ({
      from: () => ({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: '指定された製品が見つかりません',
    });
  });

  it('データベースエラー時に適切なエラーレスポンスを返す', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: mockTraceData,
    });

    const mockSupabase = createClient as jest.Mock;
    mockSupabase.mockImplementation(() => ({
      from: () => ({
        update: jest.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('データベースエラー') 
        }),
        select: jest.fn().mockResolvedValue({ 
          data: [mockTraceData], 
          error: null 
        }),
      }),
    }));

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データベース更新中にエラーが発生しました',
    });
  });

  it('不正なHTTPメソッドの場合にエラーを返す', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
    });

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    });
  });

  it('正しい形式の位置情報データを検証できる', async () => {
    const validLocationData = {
      ...mockTraceData,
      location: {
        latitude: 35.6895,
        longitude: 139.6917,
        address: '東京都渋谷区',
      },
    };

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: validLocationData,
    });

    const mockSupabase = createClient as jest.Mock;
    mockSupabase.mockImplementation(() => ({
      from: () => ({
        update: jest.fn().mockResolvedValue({ data: validLocationData, error: null }),
        select: jest.fn().mockResolvedValue({ data: [validLocationData], error: null }),
      }),
    }));

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: validLocationData,
    });
  });

  it('環境データの異常値を検出できる', async () => {
    const invalidEnvironmentData = {
      ...mockTraceData,
      temperature: 100,  // 異常な温度
      humidity: 120,     // 異常な湿度
    };

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: invalidEnvironmentData,
    });

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '環境データが許容範囲外です',
    });
  });

  it('タイムスタンプのバリデーションを行える', async () => {
    const futureTimestamp = {
      ...mockTraceData,
      timestamp: '2025-01-15T10:00:00Z',  // 未来の日付
    };

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: futureTimestamp,
    });

    await handleTraceUpdate(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '不正なタイムスタンプです',
    });
  });

  it('大量のリクエストを適切に処理できる', async () => {
    const requests = Array(10).fill(null).map((_, index) => ({
      ...mockTraceData,
      productId: `prod_${index}`,
    }));

    const mockSupabase = createClient as jest.Mock;
    mockSupabase.mockImplementation(() => ({
      from: () => ({
        update: jest.fn().mockResolvedValue({ data: mockTraceData, error: null }),
        select: jest.fn().mockResolvedValue({ data: [mockTraceData], error: null }),
      }),
    }));

    const results = await Promise.all(
      requests.map(async (data) => {
        const { req, res } = createMocks<NextApiRequest, MockResponse>({
          method: 'POST',
          body: data,
        });
        await handleTraceUpdate(req, res);
        return res._getStatusCode();
      })
    );

    expect(results.every(status => status === 200)).toBe(true);
  });
});