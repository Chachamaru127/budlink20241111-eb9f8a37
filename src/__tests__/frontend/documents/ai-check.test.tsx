```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import AICheck from '@/app/documents/ai-check/page';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockDocumentData = {
  id: 'doc-1',
  content: 'テスト文書内容',
  status: 'pending'
};

const mockAIResults = {
  documentId: 'doc-1',
  analysis: {
    issues: [
      {
        type: 'warning',
        message: '要確認項目があります',
        location: { start: 0, end: 10 }
      }
    ],
    score: 85,
    suggestions: ['修正提案1', '修正提案2']
  }
};

describe('AI書類チェック画面', () => {
  beforeEach(() => {
    axios.get.mockClear();
    axios.post.mockClear();
  });

  it('画面の初期表示が正しく行われること', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockDocumentData })
      .mockResolvedValueOnce({ data: mockAIResults });

    await act(async () => {
      render(<AICheck />);
    });

    expect(screen.getByText('AI書類チェック')).toBeInTheDocument();
    expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('ai-analyzer')).toBeInTheDocument();
  });

  it('書類アップロード機能が正しく動作すること', async () => {
    const file = new File(['テスト文書'], 'test.pdf', { type: 'application/pdf' });
    
    render(<AICheck />);
    
    const uploadInput = screen.getByTestId('file-upload');
    await userEvent.upload(uploadInput, file);

    expect(uploadInput.files[0]).toBe(file);
    expect(screen.getByText('アップロード完了')).toBeInTheDocument();
  });

  it('AI分析結果が正しく表示されること', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockDocumentData })
      .mockResolvedValueOnce({ data: mockAIResults });

    await act(async () => {
      render(<AICheck />);
    });

    expect(screen.getByText('要確認項目があります')).toBeInTheDocument();
    expect(screen.getByText('スコア: 85')).toBeInTheDocument();
  });

  it('承認/却下機能が正しく動作すること', async () => {
    axios.post.mockResolvedValue({ data: { status: 'approved' } });

    render(<AICheck />);

    const approveButton = screen.getByText('承認');
    await userEvent.click(approveButton);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        documentId: 'doc-1',
        status: 'approved'
      })
    );
  });

  it('エラー発生時にエラーメッセージが表示されること', async () => {
    axios.get.mockRejectedValue(new Error('データ取得に失敗しました'));

    await act(async () => {
      render(<AICheck />);
    });

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('修正提案が正しく表示され、適用できること', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockDocumentData })
      .mockResolvedValueOnce({ data: mockAIResults });

    await act(async () => {
      render(<AICheck />);
    });

    expect(screen.getByText('修正提案1')).toBeInTheDocument();
    
    const applySuggestionButton = screen.getByText('修正を適用');
    await userEvent.click(applySuggestionButton);

    expect(screen.getByText('修正が適用されました')).toBeInTheDocument();
  });

  it('AI分析の再実行が可能であること', async () => {
    render(<AICheck />);

    const reanalyzeButton = screen.getByText('再分析');
    await userEvent.click(reanalyzeButton);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        action: 'reanalyze',
        documentId: expect.any(String)
      })
    );
  });

  it('ハイライト表示の切り替えが可能であること', async () => {
    render(<AICheck />);

    const highlightToggle = screen.getByRole('switch', { name: 'ハイライト表示' });
    await userEvent.click(highlightToggle);

    expect(screen.getByTestId('document-viewer')).toHaveAttribute('data-highlight', 'true');
  });
});
```