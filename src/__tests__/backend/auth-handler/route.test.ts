import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getAuth } from 'firebase/auth';
import handleAuth from '@/app/api/auth-handler/route';

jest.mock('@supabase/supabase-js');
jest.mock('firebase/auth');

interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
}

describe('認証ハンドラーのテスト', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockFirebaseAuth = {
    signInWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
    createCustomToken: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (getAuth as jest.Mock).mockReturnValue(mockFirebaseAuth);
  });

  test('メール/パスワード認証が成功する場合', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        authType: 'email'
      },
    });

    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: { id: 1, email: 'test@example.com', role: 'user' }
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('token');
    expect(responseData).toHaveProperty('user');
  });

  test('Googleログインが成功する場合', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idToken: 'google-id-token',
        authType: 'google'
      },
    });

    mockFirebaseAuth.signInWithCredential.mockResolvedValueOnce({
      user: { uid: 'google-uid', email: 'google@example.com' }
    });

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: { id: 2, email: 'google@example.com', role: 'user' }
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('token');
    expect(responseData).toHaveProperty('user');
  });

  test('認証情報が不正な場合はエラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid@example.com',
        password: 'wrongpass',
        authType: 'email'
      },
    });

    mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
      new Error('auth/invalid-credentials')
    );

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(401);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('認証に失敗しました');
  });

  test('必須パラメータが不足している場合はエラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com'
      },
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('必要なパラメータが不足しています');
  });

  test('サポートされていない認証タイプの場合はエラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        authType: 'unsupported'
      },
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('サポートされていない認証方式です');
  });

  test('POSTメソッド以外はエラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('許可されていないメソッドです');
  });

  test('Supabaseのデータベースエラー時の処理', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        authType: 'email'
      },
    });

    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });

    mockSupabaseClient.single.mockRejectedValueOnce(
      new Error('Database error')
    );

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('データベースエラーが発生しました');
  });

  test('トークン生成エラー時の処理', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        authType: 'email'
      },
    });

    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });

    mockFirebaseAuth.createCustomToken.mockRejectedValueOnce(
      new Error('Token generation failed')
    );

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('トークンの生成に失敗しました');
  });

  test('ユーザー情報が存在しない場合の新規作成処理', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'password123',
        authType: 'email'
      },
    });

    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'new-uid', email: 'newuser@example.com' }
    });

    mockSupabaseClient.single.mockResolvedValueOnce({ data: null });
    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: { id: 3, email: 'newuser@example.com', role: 'user' }
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.user.email).toBe('newuser@example.com');
  });

  test('リクエストボディのバリデーション', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: '123',
        authType: 'email'
      },
    });

    await handleAuth(req as NextApiRequest, res as MockResponse);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('入力値が不正です');
  });
});