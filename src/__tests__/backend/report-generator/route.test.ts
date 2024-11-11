import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import handleReport from '@/app/api/report-generator.ts/route';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      between: jest.fn().mockReturnThis(),
      data: jest.fn(),
    })),
  })),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({
    text: jest.fn(),
    addImage: jest.fn(),
    save: jest.fn(),
  })),
}));

const mockTransactionData = [
  { id: 1, date: '2024-01-01', amount: 10000, product: 'CBD Oil' },
  { id: 2, date: '2024-01-02', amount: 15000, product: 'CBD Cream' }
];

const mockAnalyticsData = {
  totalSales: 25000,
  averageOrderValue: 12500,
  topProducts: ['CBD Oil', 'CBD Cream']
};

describe('レポート生成API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常にレポートが生成されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'sales'
      }
    });

    const supabase = createClient('', '');
    const mockSupabaseResponse = {
      data: mockTransactionData,
      error: null
    };
    
    (supabase.from('transactions').select as jest.Mock)
      .mockResolvedValueOnce(mockSupabaseResponse);

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('downloadUrl');
    expect(jsPDF).toHaveBeenCalled();
  });

  it('日付範囲のバリデーションが機能すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
        reportType: 'sales'
      }
    });

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('無効な日付範囲です');
  });

  it('存在しないレポートタイプの場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'invalid_type'
      }
    });

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('無効なレポートタイプです');
  });

  it('データ取得エラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'sales'
      }
    });

    const supabase = createClient('', '');
    const mockSupabaseResponse = {
      data: null,
      error: { message: 'Database error' }
    };
    
    (supabase.from('transactions').select as jest.Mock)
      .mockResolvedValueOnce(mockSupabaseResponse);

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('データの取得に失敗しました');
  });

  it('PDFファイル生成エラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'sales'
      }
    });

    const supabase = createClient('', '');
    const mockSupabaseResponse = {
      data: mockTransactionData,
      error: null
    };
    
    (supabase.from('transactions').select as jest.Mock)
      .mockResolvedValueOnce(mockSupabaseResponse);

    (jsPDF as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('PDF generation failed');
    });

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('レポートの生成に失敗しました');
  });

  it('異なるHTTPメソッドでリクエスト時にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('Method Not Allowed');
  });

  it('必須パラメータが欠けている場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        reportType: 'sales'
      }
    });

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('必須パラメータが不足しています');
  });

  it('レポートのカスタマイズオプションが正しく適用されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'sales',
        options: {
          includeCharts: true,
          chartType: 'bar',
          includeSummary: true
        }
      }
    });

    const supabase = createClient('', '');
    const mockSupabaseResponse = {
      data: mockTransactionData,
      error: null
    };
    
    (supabase.from('transactions').select as jest.Mock)
      .mockResolvedValueOnce(mockSupabaseResponse);

    await handleReport(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(jsPDF).toHaveBeenCalled();
    const responseData = JSON.parse(res._getData());
    expect(responseData.customOptions).toBeTruthy();
  });
});