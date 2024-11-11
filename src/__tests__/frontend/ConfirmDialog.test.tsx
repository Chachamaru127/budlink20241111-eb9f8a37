```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '@/app/ConfirmDialog/page';

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    isOpen: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    message: 'テストメッセージ'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ダイアログが表示される', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('isOpen=falseの場合、ダイアログは表示されない', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('確認ボタンをクリックするとonConfirmが呼ばれる', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('ESCキーでダイアログを閉じることができる', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('ダイアログ外をクリックするとonCancelが呼ばれる', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    const overlay = screen.getByTestId('dialog-overlay');
    await userEvent.click(overlay);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('長いメッセージを適切に表示できる', () => {
    const longMessage = 'これは非常に長いメッセージです。'.repeat(10);
    render(<ConfirmDialog {...defaultProps} message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('ボタンがdisabled状態の時はクリックできない', async () => {
    render(
      <ConfirmDialog 
        {...defaultProps}
        confirmDisabled={true}
      />
    );
    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('カスタムボタンラベルを表示できる', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="はい"
        cancelLabel="いいえ"
      />
    );
    expect(screen.getByRole('button', { name: 'はい' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'いいえ' })).toBeInTheDocument();
  });

  it('アニメーション中はボタンをクリックできない', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);
    await userEvent.click(confirmButton); // 2回目のクリック
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
```