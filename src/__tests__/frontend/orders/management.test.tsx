```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderManagement from '@/app/orders/management/page';
import { act } from 'react-dom/test-utils';

const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    buyerName: 'テスト購入者1',
    status: '新規受付',
    totalAmount: 50000,
    orderDate: '2024-01-01',
    items: [
      { id: 1, name: '商品A', quantity: 2, price: 25000 }
    ]
  },
  {
    id: '2', 
    orderNumber: 'ORD-002',
    buyerName: 'テスト購入者2',
    status: '出荷準備中',
    totalAmount: 30000,
    orderDate: '2024-01-02',
    items: [
      { id: 2, name: '商品B', quantity: 1, price: 30000 }
    ]
  }
];

jest.mock('axios', () => ({
  get: jest.fn(),
  put: jest.fn()
}));

describe('OrderManagement', () => {
  beforeEach(() => {
    // APIレスポンスのモック
    (global.axios.get as jest.Mock).mockImplementation(() => 
      Promise.resolve({ data: mockOrders })
    );
    (global.axios.put as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: { success: true } })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('注文一覧が正しく表示される', async () => {
    await act(async () => {
      render(<OrderManagement />);
    });

    expect(screen.getByText('受注管理')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('テスト購入者1')).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
  });

  test('ステータスフィルターが機能する', async () => {
    await act(async () => {
      render(<OrderManagement />);
    });

    const filterSelect = screen.getByLabelText('ステータスフィルター');
    await userEvent.selectOptions(filterSelect, '新規受付');

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
  });

  test('注文詳細が表示される', async () => {
    await act(async () => {
      render(<OrderManagement />);
    });

    const detailButton = screen.getByTestId('detail-button-1');
    await userEvent.click(detailButton);

    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText('2個')).toBeInTheDocument();
    expect(screen.getByText('¥25,000')).toBeInTheDocument();
  });

  test('ステータス更新が正しく動作する', async () => {
    await act(async () => {
      render(<OrderManagement />);
    });

    const statusUpdateButton = screen.getByTestId('status-update-1');
    await userEvent.click(statusUpdateButton);

    const statusSelect = screen.getByTestId('status-select');
    await userEvent.selectOptions(statusSelect, '出荷準備中');

    const updateConfirmButton = screen.getByText('更新');
    await userEvent.click(updateConfirmButton);

    await waitFor(() => {
      expect(global.axios.put).toHaveBeenCalledWith(
        '/api/orders/1/status',
        { status: '出荷準備中' }
      );
    });

    expect(screen.getByText('ステータスを更新しました')).toBeInTheDocument();
  });

  test('出荷処理が正しく動作する', async () => {
    await act(async () => {
      render(<OrderManagement />);
    });

    const shipButton = screen.getByTestId('ship-button-1');
    await userEvent.click(shipButton);

    const trackingNumber = screen.getByLabelText('追跡番号');
    await userEvent.type(trackingNumber, '1234567890');

    const shipConfirmButton = screen.getByText('出荷確定');
    await userEvent.click(shipConfirmButton);

    await waitFor(() => {
      expect(global.axios.put).toHaveBeenCalledWith(
        '/api/orders/1/ship',
        { trackingNumber: '1234567890', status: '出荷完了' }
      );
    });

    expect(screen.getByText('出荷処理が完了しました')).toBeInTheDocument();
  });

  test('エラー時のエラーメッセージ表示', async () => {
    (global.axios.put as jest.Mock).mockRejectedValueOnce(new Error('更新に失敗しました'));

    await act(async () => {
      render(<OrderManagement />);
    });

    const statusUpdateButton = screen.getByTestId('status-update-1');
    await userEvent.click(statusUpdateButton);

    const statusSelect = screen.getByTestId('status-select');
    await userEvent.selectOptions(statusSelect, '出荷準備中');

    const updateConfirmButton = screen.getByText('更新');
    await userEvent.click(updateConfirmButton);

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });
});
```