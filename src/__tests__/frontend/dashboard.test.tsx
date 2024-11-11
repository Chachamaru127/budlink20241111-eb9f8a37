```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Dashboard from '@/app/dashboard/page';
import '@testing-library/jest-dom';

// モックデータ
const mockUserData = {
  name: 'テストユーザー',
  email: 'test@example.com',
  role: 'admin'
};

const mockProductSummary = {
  total: 100,
  inStock: 80,
  lowStock: 10
};

const mockRecentOrders = [
  {
    id: 1,
    date: '2024-01-01',
    status: '出荷済み',
    amount: 10000
  },
  {
    id: 2, 
    date: '2024-01-02',
    status: '処理中',
    amount: 20000
  }
];

const mockNotifications = [
  {
    id: 1,
    title: '在庫アラート',
    message: '商品Aの在庫が残り少なくなっています',
    type: 'warning',
    createdAt: '2024-01-01T10:00:00'
  }
];

// APIモック
jest.mock('axios', () => ({
  get: jest.fn((url) => {
    switch(url) {
      case '/api/user':
        return Promise.resolve({ data: mockUserData });
      case '/api/products/summary':
        return Promise.resolve({ data: mockProductSummary });
      case '/api/orders/recent':
        return Promise.resolve({ data: mockRecentOrders });
      case '/api/notifications':
        return Promise.resolve({ data: mockNotifications });
      default:
        return Promise.reject(new Error('Not found'));
    }
  })
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期レンダリング時にローディング状態が表示される', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('データ取得後にダッシュボードの内容が表示される', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('在庫状況')).toBeInTheDocument();
      expect(screen.getByText('最近の注文')).toBeInTheDocument();
      expect(screen.getByText('通知')).toBeInTheDocument();
    });

    expect(screen.getByText('総在庫数: 100')).toBeInTheDocument();
    expect(screen.getByText('在庫あり: 80')).toBeInTheDocument();
    expect(screen.getByText('在庫少: 10')).toBeInTheDocument();
  });

  it('最近の注文一覧が表示される', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('¥10,000')).toBeInTheDocument();
      expect(screen.getByText('¥20,000')).toBeInTheDocument();
      expect(screen.getByText('出荷済み')).toBeInTheDocument();
      expect(screen.getByText('処理中')).toBeInTheDocument();
    });
  });

  it('通知がクリックされた時に詳細が表示される', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      const notification = screen.getByText('在庫アラート');
      fireEvent.click(notification);
    });

    expect(screen.getByText('商品Aの在庫が残り少なくなっています')).toBeInTheDocument();
  });

  it('エラー発生時にエラーメッセージが表示される', async () => {
    const mockAxios = jest.spyOn(global.axios, 'get');
    mockAxios.mockRejectedValueOnce(new Error('データの取得に失敗しました'));

    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('更新ボタンをクリックするとデータが再取得される', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const refreshButton = screen.getByRole('button', { name: '更新' });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledTimes(8); // 初回読み込み4回 + 更新時4回
    });
  });

  it('各セクションのタブ切り替えが正常に動作する', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const ordersTab = screen.getByRole('tab', { name: '注文履歴' });
    
    await act(async () => {
      fireEvent.click(ordersTab);
    });

    expect(screen.getByText('最近の注文')).toBeInTheDocument();
  });

  it('通知の既読機能が動作する', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const notification = screen.getByText('在庫アラート');
    const readButton = screen.getByRole('button', { name: '既読にする' });

    await act(async () => {
      fireEvent.click(readButton);
    });

    expect(notification).toHaveClass('read');
  });
});
```