```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import UsersPage from '@/app/admin/users/page';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

// モック
jest.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>
}));

jest.mock('@/components/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}));

const mockUsers = [
  {
    id: '1',
    email: 'test1@example.com',
    role: 'admin',
    status: 'active',
    companyName: 'Test Company 1'
  },
  {
    id: '2', 
    email: 'test2@example.com',
    role: 'user',
    status: 'inactive',
    companyName: 'Test Company 2'
  }
];

const mockRoles = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'user' }
];

describe('UsersPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers })
        });
      }
      if (url.includes('/api/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ roles: mockRoles })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }) as jest.Mock;
  });

  it('ページが正しくレンダリングされること', async () => {
    render(<UsersPage />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('ユーザー管理')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    });
  });

  it('ユーザー検索が正しく動作すること', async () => {
    render(<UsersPage />);
    
    const searchInput = screen.getByPlaceholderText('ユーザーを検索');
    await userEvent.type(searchInput, 'test1');
    
    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.queryByText('test2@example.com')).not.toBeInTheDocument();
    });
  });

  it('ユーザーの権限変更が正しく動作すること', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    });

    const roleSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(roleSelect, 'user');

    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'user' })
    });
  });

  it('ユーザーのステータス変更が正しく動作すること', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    });

    const statusToggle = screen.getAllByRole('switch')[0];
    await userEvent.click(statusToggle);

    expect(fetch).toHaveBeenCalledWith('/api/users/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'inactive' })
    });
  });

  it('エラー時にエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));
    
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('不正アクセス検知アラートが表示されること', async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/security/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            alerts: [{ 
              id: 1,
              type: 'suspicious_access',
              userId: '1',
              timestamp: new Date().toISOString()
            }]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ users: mockUsers })
      });
    }) as jest.Mock;

    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('不正アクセスの可能性があります')).toBeInTheDocument();
    });
  });
});
```