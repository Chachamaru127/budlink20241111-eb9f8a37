```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Header from '@/app/Header/page';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  companyName: 'テスト株式会社',
  role: 'ADMIN'
};

const mockOnLogout = jest.fn();

describe('Header コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザー情報が正しく表示される', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('テスト株式会社')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('ナビゲーションメニューが正しく表示される', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('商品管理')).toBeInTheDocument();
    expect(screen.getByText('トレーサビリティ')).toBeInTheDocument();
    expect(screen.getByText('取引管理')).toBeInTheDocument();
  });

  it('ユーザーメニューを開閉できる', async () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    const menuButton = screen.getByRole('button', { name: /ユーザーメニュー/i });
    await userEvent.click(menuButton);

    expect(screen.getByText('プロフィール')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
    expect(screen.getByText('ログアウト')).toBeInTheDocument();

    await userEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.queryByText('プロフィール')).not.toBeInTheDocument();
    });
  });

  it('ログアウトボタンクリックで onLogout が呼ばれる', async () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    const menuButton = screen.getByRole('button', { name: /ユーザーメニュー/i });
    await userEvent.click(menuButton);
    
    const logoutButton = screen.getByText('ログアウト');
    await userEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('モバイルメニューが正しく動作する', async () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /メニュー/i });
    await userEvent.click(mobileMenuButton);

    expect(screen.getByText('ダッシュボード')).toBeVisible();
    expect(screen.getByText('商品管理')).toBeVisible();

    await userEvent.click(mobileMenuButton);
    await waitFor(() => {
      expect(screen.queryByText('ダッシュボード')).not.toBeVisible();
    });
  });

  it('未ログイン状態で制限されたメニューが表示されない', () => {
    render(<Header user={null} onLogout={mockOnLogout} />);
    
    expect(screen.queryByText('取引管理')).not.toBeInTheDocument();
    expect(screen.queryByText('設定')).not.toBeInTheDocument();
  });

  it('管理者ユーザーに管理者メニューが表示される', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('システム管理')).toBeInTheDocument();
    expect(screen.getByText('ユーザー管理')).toBeInTheDocument();
  });

  it('通知バッジが正しく表示される', () => {
    const userWithNotifications = {
      ...mockUser,
      notifications: 5
    };
    
    render(<Header user={userWithNotifications} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('ロゴクリックでホームに遷移する', async () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    const logo = screen.getByAltText('BudLink Logo');
    await userEvent.click(logo);
    
    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/');
  });
});
```