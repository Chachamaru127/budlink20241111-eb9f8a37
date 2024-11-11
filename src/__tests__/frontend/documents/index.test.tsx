```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentsPage from '@/app/documents/index/page';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// モックデータ
const mockDocuments = [
  {
    id: '1',
    name: '許可証A',
    uploadDate: '2024-01-01',
    expiryDate: '2024-12-31',
    status: '有効',
    url: 'https://example.com/doc1.pdf'
  },
  {
    id: '2', 
    name: '申請書B',
    uploadDate: '2024-01-15',
    expiryDate: '2024-06-30',
    status: '期限間近',
    url: 'https://example.com/doc2.pdf'
  }
];

// APIモック
jest.mock('axios');
global.axios.get.mockResolvedValue({ data: mockDocuments });
global.axios.post.mockResolvedValue({ data: { message: 'アップロード成功' } });

describe('DocumentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('書類一覧が正しく表示される', async () => {
    render(<DocumentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('許可証A')).toBeInTheDocument();
      expect(screen.getByText('申請書B')).toBeInTheDocument();
    });
  });

  it('検索機能が正しく動作する', async () => {
    render(<DocumentsPage />);
    
    const searchInput = screen.getByPlaceholderText('書類を検索');
    await userEvent.type(searchInput, '許可証');

    await waitFor(() => {
      expect(screen.getByText('許可証A')).toBeInTheDocument();
      expect(screen.queryByText('申請書B')).not.toBeInTheDocument();
    });
  });

  it('ファイルアップロードが正しく動作する', async () => {
    render(<DocumentsPage />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const uploadInput = screen.getByLabelText('ファイルを選択');

    await userEvent.upload(uploadInput, file);
    
    const uploadButton = screen.getByText('アップロード');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalled();
      expect(screen.getByText('アップロード成功')).toBeInTheDocument();
    });
  });

  it('有効期限アラートが正しく表示される', async () => {
    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('期限間近')).toBeInTheDocument();
    });
  });

  it('書類ビューワーが正しく開く', async () => {
    render(<DocumentsPage />);

    await waitFor(() => {
      const viewButton = screen.getAllByText('閲覧')[0];
      fireEvent.click(viewButton);
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
    });
  });

  it('エラーメッセージが適切に表示される', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('読み込みエラー'));
    
    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('書類の読み込みに失敗しました')).toBeInTheDocument();
    });
  });

  it('ソート機能が正しく動作する', async () => {
    render(<DocumentsPage />);

    const sortButton = screen.getByText('アップロード日');
    await userEvent.click(sortButton);

    await waitFor(() => {
      const documents = screen.getAllByRole('row');
      expect(documents[1]).toHaveTextContent('申請書B');
      expect(documents[2]).toHaveTextContent('許可証A');
    });
  });

  it('ページネーションが正しく動作する', async () => {
    render(<DocumentsPage />);

    const nextPageButton = screen.getByLabelText('次のページ');
    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('ファイルタイプバリデーションが正しく機能する', async () => {
    render(<DocumentsPage />);

    const invalidFile = new File(['dummy'], 'test.exe', { type: 'application/x-msdownload' });
    const uploadInput = screen.getByLabelText('ファイルを選択');

    await userEvent.upload(uploadInput, invalidFile);

    expect(screen.getByText('無効なファイル形式です')).toBeInTheDocument();
  });
});
```