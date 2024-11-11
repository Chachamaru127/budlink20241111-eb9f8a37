```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '@/app/AuthForm/page';

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('ログインフォーム', () => {
    beforeEach(() => {
      render(
        <AuthForm
          onSubmit={mockOnSubmit}
          formType="login"
          loading={false}
        />
      );
    });

    test('メールアドレスとパスワードの入力フィールドが表示される', () => {
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    });

    test('必須フィールドが空の場合にバリデーションエラーが表示される', async () => {
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument();
        expect(screen.getByText('パスワードは必須です')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('不正なメールアドレス形式の場合にエラーが表示される', async () => {
      const emailInput = screen.getByLabelText('メールアドレス');
      await userEvent.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    test('正常な入力の場合、onSubmitが呼ばれる', async () => {
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('サインアップフォーム', () => {
    beforeEach(() => {
      render(
        <AuthForm
          onSubmit={mockOnSubmit}
          formType="signup"
          loading={false}
        />
      );
    });

    test('追加の登録フィールドが表示される', () => {
      expect(screen.getByLabelText('会社名')).toBeInTheDocument();
      expect(screen.getByLabelText('確認用パスワード')).toBeInTheDocument();
    });

    test('パスワードと確認用パスワードが一致しない場合にエラーが表示される', async () => {
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('確認用パスワード');

      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password456');

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
    });

    test('正常な入力の場合、onSubmitが呼ばれる', async () => {
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('確認用パスワード');
      const companyNameInput = screen.getByLabelText('会社名');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.type(companyNameInput, 'テスト株式会社');

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          companyName: 'テスト株式会社'
        });
      });
    });
  });

  describe('ローディング状態', () => {
    test('ローディング中はボタンが無効化される', () => {
      render(
        <AuthForm
          onSubmit={mockOnSubmit}
          formType="login"
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('フォームの切り替え', () => {
    test('ログインとサインアップの切り替えリンクが機能する', () => {
      const { rerender } = render(
        <AuthForm
          onSubmit={mockOnSubmit}
          formType="login"
          loading={false}
        />
      );

      expect(screen.getByText('アカウントをお持ちでない方はこちら')).toBeInTheDocument();

      rerender(
        <AuthForm
          onSubmit={mockOnSubmit}
          formType="signup"
          loading={false}
        />
      );

      expect(screen.getByText('既にアカウントをお持ちの方はこちら')).toBeInTheDocument();
    });
  });
});
```