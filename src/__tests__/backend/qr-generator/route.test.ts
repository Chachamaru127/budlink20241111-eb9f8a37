import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { generateQRCode } from '@/app/api/qr-generator/route';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
  toFile: jest.fn(),
}));

describe('QRコード生成API', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
    eq: jest.fn(),
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    jest.clearAllMocks();
  });

  it('正常なリクエストで単一QRコードを生成する', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: '123',
        traceInfo: {
          productName: 'テスト商品',
          manufacturer: 'テストメーカー',
          lotNumber: 'LOT123'
        }
      }
    });

    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockQRCode');
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: '456', url: 'https://example.com/qr/456' },
      error: null
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      qrCode: 'data:image/png;base64,mockQRCode',
      url: 'https://example.com/qr/456'
    });
  });

  it('バッチモードで複数QRコードを生成する', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        batchMode: true,
        products: [
          {
            productId: '123',
            traceInfo: { lotNumber: 'LOT123' }
          },
          {
            productId: '124',
            traceInfo: { lotNumber: 'LOT124' }
          }
        ]
      }
    });

    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockQRCode');
    mockSupabaseClient.insert.mockResolvedValue({
      data: [
        { id: '456', url: 'https://example.com/qr/456' },
        { id: '457', url: 'https://example.com/qr/457' }
      ],
      error: null
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      qrCodes: [
        {
          qrCode: 'data:image/png;base64,mockQRCode',
          url: 'https://example.com/qr/456'
        },
        {
          qrCode: 'data:image/png;base64,mockQRCode',
          url: 'https://example.com/qr/457'
        }
      ]
    });
  });

  it('トレーサビリティ情報が不正な場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: '123',
        traceInfo: {} // 空のトレース情報
      }
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'トレーサビリティ情報が不正です'
    });
  });

  it('QRコード生成に失敗した場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: '123',
        traceInfo: {
          productName: 'テスト商品',
          manufacturer: 'テストメーカー',
          lotNumber: 'LOT123'
        }
      }
    });

    (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QRコード生成エラー'));

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'QRコードの生成に失敗しました'
    });
  });

  it('DBへの保存に失敗した場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: '123',
        traceInfo: {
          productName: 'テスト商品',
          manufacturer: 'テストメーカー',
          lotNumber: 'LOT123'
        }
      }
    });

    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockQRCode');
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: new Error('DB保存エラー')
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'QRコードの保存に失敗しました'
    });
  });

  it('不正なHTTPメソッドの場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Method not allowed'
    });
  });

  it('リクエストボディが不正な場合エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: null
    });

    await generateQRCode(req as NextApiRequest, res as NextApiResponse);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'リクエストボディが不正です'
    });
  });
});