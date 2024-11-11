import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import documentVerification from '@/app/api/document-verification/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}));

jest.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: jest.fn().mockImplementation(() => ({
    beginAnalyzeDocument: jest.fn().mockResolvedValue({
      pollUntilDone: jest.fn().mockResolvedValue({
        pages: [{ lines: [{ content: 'テスト文書内容' }] }],
      }),
    }),
  })),
}));

describe('AI書類検証処理 API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createClient('', '');
    jest.clearAllMocks();
  });

  it('POST: 書類アップロードと検証が正常に完了すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentId: 'doc-1',
        fileUrl: 'https://example.com/test.pdf',
      },
    });

    mockSupabase.from().single.mockResolvedValueOnce({
      data: { id: 'doc-1', content: 'テスト文書内容' },
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('analysis');
    expect(responseData.analysis).toHaveProperty('score');
    expect(responseData.documentId).toBe('doc-1');
  });

  it('POST: 不正なリクエストボディの場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid request body',
    });
  });

  it('GET: 書類の検証結果を取得できること', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { documentId: 'doc-1' },
    });

    mockSupabase.from().single.mockResolvedValueOnce({
      data: {
        id: 'doc-1',
        analysis: {
          score: 85,
          issues: [{ type: 'warning', message: '要確認項目があります' }],
          suggestions: ['修正提案1'],
        },
      },
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.documentId).toBe('doc-1');
    expect(responseData.analysis.score).toBe(85);
  });

  it('GET: 存在しない書類IDの場合404を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { documentId: 'non-existent' },
    });

    mockSupabase.from().single.mockRejectedValueOnce(new Error('Not found'));

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Document not found',
    });
  });

  it('PUT: 検証結果の更新が正常に完了すること', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        documentId: 'doc-1',
        status: 'approved',
        comments: 'OK',
      },
    });

    mockSupabase.from().update().eq().single.mockResolvedValueOnce({
      data: { id: 'doc-1', status: 'approved' },
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.status).toBe('approved');
  });

  it('OCR処理が失敗した場合エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentId: 'doc-1',
        fileUrl: 'https://example.com/test.pdf',
      },
    });

    const mockError = new Error('OCR processing failed');
    jest.spyOn(DocumentAnalysisClient.prototype, 'beginAnalyzeDocument')
      .mockRejectedValueOnce(mockError);

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'OCR processing failed',
    });
  });

  it('AI分析の再実行リクエストが正常に処理されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        documentId: 'doc-1',
        action: 'reanalyze',
      },
    });

    mockSupabase.from().single.mockResolvedValueOnce({
      data: { id: 'doc-1', content: 'テスト文書内容' },
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('analysis');
    expect(responseData.documentId).toBe('doc-1');
  });

  it('サポートされていないHTTPメソッドの場合405を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
    });

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    });
  });

  it('データベース接続エラーの場合500を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { documentId: 'doc-1' },
    });

    mockSupabase.from().single.mockRejectedValueOnce(new Error('Database connection failed'));

    await documentVerification(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal server error',
    });
  });
});