```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import InventoryPage from '@/app/inventory/index/page';
import userEvent from '@testing-library/user-event';

// モックの定義
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

const mockInventoryData = [
  { id: 1, productName: '商品A', currentStock: 100, alertThreshold: 20 },
  { id: 2, productName: '商品B', currentStock: 50, alertThreshold: 10 }
];

const mockHistoryData = [
  { id: 1, productId: 1, changeAmount: 10, date: '2024-01-01', type: '入庫' },
  { id: 2, productId: 1, changeAmount: -5, date: '2024-01-02', type: '出庫' }
];

describe('InventoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/inventory')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInventoryData)
        });
      } else if (url.includes('/api/stock-history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistoryData)
        });
      }
    });
  });

  test('在庫一覧が正しくレンダリングされること', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  test('在庫数更新が正しく動作すること', async () => {
    render(<InventoryPage />);
    
    const updateButton = await screen.findByRole('button', { name: '在庫数更新' });
    fireEvent.click(updateButton);
    
    const stockInput = screen.getByLabelText('在庫数');
    await userEvent.type(stockInput, '150');
    
    const submitButton = screen.getByRole('button', { name: '更新' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/inventory/update',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });
  });

  test('アラート設定の変更が正しく動作すること', async () => {
    render(<InventoryPage />);
    
    const settingsButton = await screen.findByRole('button', { name: 'アラート設定' });
    fireEvent.click(settingsButton);
    
    const thresholdInput = screen.getByLabelText('アラートしきい値');
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, '30');
    
    const saveButton = screen.getByRole('button', { name: '保存' });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/inventory/settings',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });
  });

  test('在庫履歴が正しく表示されること', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('入庫')).toBeInTheDocument();
      expect(screen.getByText('出庫')).toBeInTheDocument();
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });
  });

  test('エラー時にエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() => 
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('ローディング状態が正しく表示されること', async () => {
    render(<InventoryPage />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });

  test('在庫検索フィルターが正しく動作すること', async () => {
    render(<InventoryPage />);
    
    const searchInput = await screen.findByPlaceholderText('商品名で検索');
    await userEvent.type(searchInput, '商品A');
    
    await waitFor(() => {
      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.queryByText('商品B')).not.toBeInTheDocument();
    });
  });

  test('在庫ソート機能が正しく動作すること', async () => {
    render(<InventoryPage />);
    
    const sortButton = await screen.findByRole('button', { name: '在庫数でソート' });
    fireEvent.click(sortButton);
    
    const stockValues = screen.getAllByTestId('stock-value');
    expect(stockValues[0]).toHaveTextContent('50');
    expect(stockValues[1]).toHaveTextContent('100');
  });
});
```