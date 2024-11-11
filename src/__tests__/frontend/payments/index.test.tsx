```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PaymentsPage from '@/app/payments/index/page';

// モックデータ
const mockPayments = [
  {
    id: 'p1',
    amount: 10000,
    status: '完了',
    date: '2024-01-01',
    paymentMethod: 'クレジットカード'
  },
  {
    id: 'p2', 
    amount: 20000,
    status: '保留中',
    date: '2024-01-02',
    paymentMethod: '銀行振込'
  }
];

const mockTransactions = [
  {
    id: 't1',
    type: '入金',
    amount: 10000,
    date: '2024-01-01'
  },
  {
    id: 't2',
    type: '出金', 
    amount: 5000,
    date: '2024-01-02'
  }
];

// モック
jest.mock('@/app/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/app/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('axios');

describe('PaymentsPage', () => {
  beforeEach(() => {
    global.axios.get.mockImplementation((url) => {
      if (url.includes('payments')) {
        return Promise.resolve({ data: mockPayments });
      }
      if (url.includes('transactions')) {
        return Promise.resolve({ data: mockTransactions });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ページが正しくレンダリングされること', async () => {
    render(<PaymentsPage />);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByText('決済一覧')).toBeInTheDocument();
  });

  it('決済データが正しく表示されること', async () => {
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('¥10,000')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
      expect(screen.getByText('クレジットカード')).toBeInTheDocument();
    });
  });

  it('フィルターが正しく機能すること', async () => {
    render(<PaymentsPage />);
    
    const filterSelect = screen.getByLabelText('決済状況');
    await userEvent.selectOptions(filterSelect, '完了');

    await waitFor(() => {
      expect(screen.getByText('完了')).toBeInTheDocument();
      expect(screen.queryByText('保留中')).not.toBeInTheDocument();
    });
  });

  it('入出金履歴が正しく表示されること', async () => {
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('入金')).toBeInTheDocument();
      expect(screen.getByText('¥10,000')).toBeInTheDocument();
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });
  });

  it('明細ダウンロードボタンが機能すること', async () => {
    const mockDownload = jest.fn();
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    
    render(<PaymentsPage />);
    
    const downloadButton = screen.getByText('明細ダウンロード');
    await userEvent.click(downloadButton);

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith('/api/payments/download');
    });
  });

  it('日付範囲フィルターが機能すること', async () => {
    render(<PaymentsPage />);

    const startDateInput = screen.getByLabelText('開始日');
    const endDateInput = screen.getByLabelText('終了日');

    await userEvent.type(startDateInput, '2024-01-01');
    await userEvent.type(endDateInput, '2024-01-02');

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01')
      );
    });
  });

  it('エラー状態が適切に表示されること', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('ページネーションが機能すること', async () => {
    render(<PaymentsPage />);

    const nextPageButton = screen.getByLabelText('次のページ');
    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('決済詳細モーダルが表示されること', async () => {
    render(<PaymentsPage />);

    const detailButton = screen.getByText('詳細を見る');
    await userEvent.click(detailButton);

    await waitFor(() => {
      expect(screen.getByText('決済詳細')).toBeInTheDocument();
      expect(screen.getByText('クレジットカード')).toBeInTheDocument();
      expect(screen.getByText('¥10,000')).toBeInTheDocument();
    });
  });
});
```