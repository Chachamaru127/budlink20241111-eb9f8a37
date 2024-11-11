```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockAuthSubmit = jest.fn();
jest.mock('@/components/AuthForm', () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: (email: string, password: string) => void }) => (
    <div data-testid="mock-auth-form">
      <input type="email" data-testid="email-input" onChange={(e) => e.target.value} />
      <input type="password" data-testid="password-input" onChange={(e) => e.target.value} />
      <button onClick={() => onSubmit('test@example.com', 'password123')}>ログイン</button>
    </div>
  ),
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-header">ヘッダー</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true, 
  default: () => <div data-testid="mock-footer">フッター</div>,
}));

describe('ログイン画面', () => {
  beforeEach(() => {
    mockAuthSubmit.mockClear();
    global.mockNextRouter.push.mockClear();
  });

  test('レンダリング時に必要なコンポーネントが表示される', () => {
    render(<LoginPage />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-auth-form')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  test('ログイン成功時にダッシュボードへ遷移する', async () => {
    const response = { 
      status: 200,
      data: { token: 'dummy-token', user: { id: 1, email: 'test@example.com' } }
    };
    global.axios.post.mockResolvedValueOnce(response);

    render(<LoginPage />);
    
    const loginButton = screen.getByText('ログイン');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(global.mockNextRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('ログイン失敗時にエラーメッセージを表示する', async () => {
    const error = new Error('認証エラー');
    global.axios.post.mockRejectedValueOnce(error);

    render(<LoginPage />);
    
    const loginButton = screen.getByText('ログイン');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeInTheDocument();
    });
  });

  test('パスワードリセットリンクが正しく機能する', async () => {
    render(<LoginPage />);
    
    const resetLink = screen.getByText('パスワードをお忘れの方');
    await userEvent.click(resetLink);

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/reset-password');
  });

  test('新規登録リンクが正しく機能する', async () => {
    render(<LoginPage />);
    
    const signupLink = screen.getByText('新規登録はこちら');
    await userEvent.click(signupLink);

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/signup');
  });

  test('入力フィールドのバリデーションが正しく機能する', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByText('ログイン');

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, '123');
    await userEvent.click(loginButton);

    expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
    expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
  });

  test('ローディング状態が正しく表示される', async () => {
    const slowResponse = new Promise((resolve) => setTimeout(resolve, 1000));
    global.axios.post.mockImplementationOnce(() => slowResponse);

    render(<LoginPage />);
    
    const loginButton = screen.getByText('ログイン');
    await userEvent.click(loginButton);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  test('認証エラー時にエラーメッセージが正しく表示される', async () => {
    const networkError = new Error('Network Error');
    global.axios.post.mockRejectedValueOnce(networkError);

    render(<LoginPage />);
    
    const loginButton = screen.getByText('ログイン');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('通信エラーが発生しました。時間をおいて再度お試しください。')).toBeInTheDocument();
    });
  });
});
```