import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import paymentHandler from '@/app/api/payment-processor/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

describe('決済処理APIのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPaymentData = {
    amount: 10000,
    currency: 'jpy',
    paymentMethod: 'card',
    customerId: 'cus_123',
    description: 'テスト決済',
  };

  it('正常な決済リクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validPaymentData,
    });

    mockStripe.paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
      client_secret: 'secret_123',
    });

    mockSupabase.from().insert.mockResolvedValueOnce({ data: { id: 1 }, error: null });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        paymentIntentId: 'pi_123',
        status: 'succeeded',
      })
    );
  });

  it('不正な決済リクエストを拒否すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { ...validPaymentData, amount: -1000 },
    });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('決済サービスのエラーを適切にハンドリングすること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validPaymentData,
    });

    mockStripe.paymentIntents.create.mockRejectedValueOnce(new Error('決済サービスエラー'));

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('決済状態の確認ができること', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { paymentIntentId: 'pi_123' },
    });

    mockStripe.paymentIntents.retrieve.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
    });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('status', 'succeeded');
  });

  it('取引記録が正しく更新されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validPaymentData,
    });

    mockStripe.paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
    });

    await paymentHandler(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
    expect(mockSupabase.from().insert).toHaveBeenCalled();
  });

  it('不正なHTTPメソッドを拒否すること', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: validPaymentData,
    });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('決済確認処理が正しく動作すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        paymentIntentId: 'pi_123',
        action: 'confirm',
      },
    });

    mockStripe.paymentIntents.confirm.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
    });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockStripe.paymentIntents.confirm).toHaveBeenCalled();
  });

  it('データベースエラーを適切にハンドリングすること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: validPaymentData,
    });

    mockStripe.paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
    });

    mockSupabase.from().insert.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('金額の検証が正しく機能すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { ...validPaymentData, amount: '不正な金額' },
    });

    await paymentHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });
});