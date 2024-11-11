```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '@/app/FileUpload/page';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

describe('FileUpload', () => {
  const mockOnUpload = jest.fn();
  const defaultProps = {
    onUpload: mockOnUpload,
    acceptedTypes: ['.pdf', '.jpg', '.png'],
    maxSize: 5 * 1024 * 1024 // 5MB
  };

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('ファイルアップロードエリアが表示される', () => {
    render(<FileUpload {...defaultProps} />);
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    expect(screen.getByText('ファイルをドラッグ＆ドロップ')).toBeInTheDocument();
  });

  it('許可されたファイル形式のみアップロード可能', async () => {
    render(<FileUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    await act(async () => {
      const event = createDragEvent(file);
      fireEvent.drop(dropZone, event);
    });

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('許可されていないファイル形式はエラーメッセージを表示', async () => {
    render(<FileUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const dropZone = screen.getByTestId('drop-zone');

    await act(async () => {
      const event = createDragEvent(file);
      fireEvent.drop(dropZone, event);
    });

    expect(screen.getByText('対応していないファイル形式です')).toBeInTheDocument();
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('ファイルサイズ制限を超えた場合エラーメッセージを表示', async () => {
    render(<FileUpload {...defaultProps} />);

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    await act(async () => {
      const event = createDragEvent(largeFile);
      fireEvent.drop(dropZone, event);
    });

    expect(screen.getByText('ファイルサイズが制限を超えています')).toBeInTheDocument();
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('ドラッグオーバー時のスタイル変更', async () => {
    render(<FileUpload {...defaultProps} />);
    const dropZone = screen.getByTestId('drop-zone');

    await act(async () => {
      fireEvent.dragEnter(dropZone);
    });

    expect(dropZone).toHaveClass('drag-active');

    await act(async () => {
      fireEvent.dragLeave(dropZone);
    });

    expect(dropZone).not.toHaveClass('drag-active');
  });

  it('アップロード中の状態表示', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<FileUpload {...defaultProps} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    await act(async () => {
      const event = createDragEvent(file);
      fireEvent.drop(dropZone, event);
    });

    expect(screen.getByText('アップロード中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('アップロード中...')).not.toBeInTheDocument();
    });
  });

  it('クリックでファイル選択が可能', async () => {
    render(<FileUpload {...defaultProps} />);
    const input = screen.getByTestId('file-input');
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await act(async () => {
      userEvent.upload(input, file);
    });

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });
});

// ヘルパー関数
function createDragEvent(file: File) {
  return {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        }
      ],
      types: ['Files']
    }
  };
}
```