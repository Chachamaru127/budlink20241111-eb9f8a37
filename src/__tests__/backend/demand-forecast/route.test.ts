import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import handleDemandForecast from '@/app/api/demand-forecast/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  rpc: jest.fn(),
};

(createClient as jest.Mock).mockImplementation(() => mockSupabase);

describe('需要予測APIハンドラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSalesData = [
    { date: '2023-12-01', amount: 100 },
    { date: '2023-11-01', amount: 90 },
    { date: '2023-10-01', amount: 110 }
  ];

  const mockPredictionResult = {
    dates: ['2024-01', '2024-02', '2024-03'],
    values: [120, 130, 140],
    predictions: [150, 160, 170],
    confidence_intervals: {
      upper: [160, 170, 180],
      lower: [140, 150, 160]
    }
  };

  it('正常な予測リクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'arima'
      }
    });

    mockSupabase.rpc.mockResolvedValueOnce({ 
      data: mockPredictionResult,
      error: null
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual(mockPredictionResult);
  });

  it('必須パラメータが欠けている場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        period: 6
      }
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('必須パラメータが不足しています');
  });

  it('不正な分析期間でエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 13,
        model: 'arima'
      }
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('分析期間は1〜12ヶ月の間で指定してください');
  });

  it('不正な予測モデルでエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'invalid_model'
      }
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('サポートされていない予測モデルです');
  });

  it('データベースエラーを適切に処理すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'arima'
      }
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'データベースエラー' }
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('予測処理中にエラーが発生しました');
  });

  it('GET メソッドでアクセスした場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('許可されていないメソッドです');
  });

  it('予測データが空の場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'arima'
      }
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(404);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('予測に必要なデータが不足しています');
  });

  it('信頼区間の計算が正しく行われること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'arima',
        confidenceLevel: 0.95
      }
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: mockPredictionResult,
      error: null
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.confidence_intervals).toBeDefined();
    expect(responseData.confidence_intervals.upper.length).toBe(3);
    expect(responseData.confidence_intervals.lower.length).toBe(3);
  });

  it('異常な信頼区間パラメータでエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 6,
        model: 'arima',
        confidenceLevel: 2.0
      }
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('信頼区間は0〜1の間で指定してください');
  });

  it('大量のデータに対して適切に処理できること', async () => {
    const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
      date: `2023-${String(i % 12 + 1).padStart(2, '0')}-01`,
      amount: Math.random() * 1000
    }));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'prod_123',
        period: 12,
        model: 'arima'
      }
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        ...mockPredictionResult,
        dates: Array.from({ length: 12 }, (_, i) => `2024-${String(i + 1).padStart(2, '0')}`),
        values: Array.from({ length: 12 }, () => Math.random() * 1000),
        predictions: Array.from({ length: 12 }, () => Math.random() * 1000)
      },
      error: null
    });

    await handleDemandForecast(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.dates.length).toBe(12);
    expect(responseData.values.length).toBe(12);
    expect(responseData.predictions.length).toBe(12);
  });
});