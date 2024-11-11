```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import DocumentViewer from '@/app/DocumentViewer/page';

const mockDocumentUrl = 'https://example.com/document.pdf';

describe('DocumentViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PDFビューワーが正しくレンダリングされること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('document-container')).toHaveAttribute('data-url', mockDocumentUrl);
  });

  it('画像ファイルが正しくレンダリングされること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="image" />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockDocumentUrl);
    expect(image).toHaveAttribute('alt', 'document');
  });

  it('テキストファイルが正しくレンダリングされること', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('テストテキストコンテンツ')
      })
    ) as jest.Mock;

    render(<DocumentViewer documentUrl={mockDocumentUrl} type="text" />);
    
    await waitFor(() => {
      expect(screen.getByText('テストテキストコンテンツ')).toBeInTheDocument();
    });
  });

  it('ズーム機能が正しく動作すること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    const zoomInButton = screen.getByRole('button', { name: '拡大' });
    const zoomOutButton = screen.getByRole('button', { name: '縮小' });
    
    fireEvent.click(zoomInButton);
    expect(screen.getByTestId('document-container')).toHaveStyle({ transform: 'scale(1.1)' });
    
    fireEvent.click(zoomOutButton);
    expect(screen.getByTestId('document-container')).toHaveStyle({ transform: 'scale(1)' });
  });

  it('ダウンロードボタンが正しく動作すること', () => {
    const mockCreateElement = document.createElement.bind(document);
    const mockAnchorClick = jest.fn();
    
    document.createElement = jest.fn().mockImplementation((tagName) => {
      const element = mockCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockAnchorClick;
      }
      return element;
    });

    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    const downloadButton = screen.getByRole('button', { name: 'ダウンロード' });
    fireEvent.click(downloadButton);
    
    expect(mockAnchorClick).toHaveBeenCalled();
    document.createElement = mockCreateElement;
  });

  it('エラー時にエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('読み込みエラー'))
    ) as jest.Mock;

    render(<DocumentViewer documentUrl={mockDocumentUrl} type="text" />);
    
    await waitFor(() => {
      expect(screen.getByText('ドキュメントの読み込みに失敗しました。')).toBeInTheDocument();
    });
  });

  it('ローディング状態が正しく表示されること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('無効なファイルタイプの場合にエラーメッセージが表示されること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="invalid" />);
    
    expect(screen.getByText('サポートされていないファイル形式です。')).toBeInTheDocument();
  });

  it('ページ切り替え機能が正しく動作すること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    const nextPageButton = screen.getByRole('button', { name: '次のページ' });
    const prevPageButton = screen.getByRole('button', { name: '前のページ' });
    
    fireEvent.click(nextPageButton);
    expect(screen.getByText('ページ: 2')).toBeInTheDocument();
    
    fireEvent.click(prevPageButton);
    expect(screen.getByText('ページ: 1')).toBeInTheDocument();
  });

  it('回転機能が正しく動作すること', () => {
    render(<DocumentViewer documentUrl={mockDocumentUrl} type="pdf" />);
    
    const rotateButton = screen.getByRole('button', { name: '回転' });
    
    fireEvent.click(rotateButton);
    expect(screen.getByTestId('document-container')).toHaveStyle({ transform: 'rotate(90deg)' });
    
    fireEvent.click(rotateButton);
    expect(screen.getByTestId('document-container')).toHaveStyle({ transform: 'rotate(180deg)' });
  });
});
```