```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TraceabilityRegister from '@/app/traceability/register/page';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

jest.mock('@/components/Header', () => {
  return function DummyHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function DummySidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/FileUpload', () => {
  return function DummyFileUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
    return (
      <input
        data-testid="mock-file-upload"
        type="file"
        onChange={(e) => {
          if (e.target.files) {
            onUpload(Array.from(e.target.files));
          }
        }}
      />
    );
  };
});

jest.mock('@/components/ConfirmDialog', () => {
  return function DummyConfirmDialog({ isOpen, onConfirm, onCancel }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-confirm-dialog">
        <button onClick={onConfirm}>確認</button>
        <button onClick={onCancel}>キャンセル</button>
      </div>
    );
  };
});

const mockRouter = {
  push: jest.fn()
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('トレーサビリティ情報登録画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須コンポーネントが正しくレンダリングされること', () => {
    render(<TraceabilityRegister />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-file-upload')).toBeInTheDocument();
    expect(screen.getByTestId('traceability-form')).toBeInTheDocument();
  });

  it('製品情報の入力が正しく動作すること', async () => {
    render(<TraceabilityRegister />);
    
    const productNameInput = screen.getByLabelText('製品名');
    const lotNumberInput = screen.getByLabelText('ロット番号');
    
    await userEvent.type(productNameInput, 'テスト製品');
    await userEvent.type(lotNumberInput, 'LOT2024001');

    expect(productNameInput).toHaveValue('テスト製品');
    expect(lotNumberInput).toHaveValue('LOT2024001');
  });

  it('ファイルアップロードが正しく動作すること', async () => {
    render(<TraceabilityRegister />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('mock-file-upload');

    await userEvent.upload(fileInput, file);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('バリデーションエラーが正しく表示されること', async () => {
    render(<TraceabilityRegister />);
    
    const submitButton = screen.getByRole('button', { name: '登録する' });
    await userEvent.click(submitButton);

    expect(screen.getByText('製品名は必須です')).toBeInTheDocument();
    expect(screen.getByText('ロット番号は必須です')).toBeInTheDocument();
  });

  it('登録確認ダイアログが正しく表示されること', async () => {
    render(<TraceabilityRegister />);
    
    const productNameInput = screen.getByLabelText('製品名');
    const lotNumberInput = screen.getByLabelText('ロット番号');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(productNameInput, 'テスト製品');
    await userEvent.type(lotNumberInput, 'LOT2024001');
    await userEvent.click(submitButton);

    expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
  });

  it('登録成功時に一覧画面に遷移すること', async () => {
    render(<TraceabilityRegister />);
    
    const productNameInput = screen.getByLabelText('製品名');
    const lotNumberInput = screen.getByLabelText('ロット番号');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(productNameInput, 'テスト製品');
    await userEvent.type(lotNumberInput, 'LOT2024001');
    await userEvent.click(submitButton);

    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/traceability/list');
    });
  });

  it('登録キャンセル時にダイアログが閉じること', async () => {
    render(<TraceabilityRegister />);
    
    const productNameInput = screen.getByLabelText('製品名');
    const lotNumberInput = screen.getByLabelText('ロット番号');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(productNameInput, 'テスト製品');
    await userEvent.type(lotNumberInput, 'LOT2024001');
    await userEvent.click(submitButton);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    expect(screen.queryByTestId('mock-confirm-dialog')).not.toBeInTheDocument();
  });

  it('エラー発生時にエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn(() => 
      Promise.reject(new Error('登録に失敗しました'))
    );

    render(<TraceabilityRegister />);
    
    const productNameInput = screen.getByLabelText('製品名');
    const lotNumberInput = screen.getByLabelText('ロット番号');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(productNameInput, 'テスト製品');
    await userEvent.type(lotNumberInput, 'LOT2024001');
    await userEvent.click(submitButton);

    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました')).toBeInTheDocument();
    });
  });
});
```