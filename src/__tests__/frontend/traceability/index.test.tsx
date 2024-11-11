```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import TraceabilityList from '@/app/traceability/index/page';

// モックデータ
const mockTraceData = [
  {
    id: '1',
    productId: 'p1',
    lotNumber: 'LOT001',
    productName: 'CBD Oil',
    status: '流通中',
    updatedAt: '2024-01-01'
  },
  {
    id: '2', 
    productId: 'p2',
    lotNumber: 'LOT002',
    productName: 'CBD Cream',
    status: '出荷済み',
    updatedAt: '2024-01-02'
  }
];

// モックの定義
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />
}));

jest.mock('@/components/Sidebar', () => ({
  __esModule: true, 
  default: () => <div data-testid="sidebar" />
}));

jest.mock('@/components/SearchFilter', () => ({
  __esModule: true,
  default: ({ onFilter }: { onFilter: (filters: any) => void }) => (
    <div data-testid="search-filter">
      <button onClick={() => onFilter({ keyword: 'test' })}>Filter</button>
    </div>
  )
}));

jest.mock('@/components/Pagination', () => ({
  __esModule: true,
  default: ({ onPageChange }: { onPageChange: (page: number) => void }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(2)}>Next</button>
    </div>
  )
}));

// APIコールのモック
jest.mock('axios');

describe('トレーサビリティ情報一覧画面', () => {
  beforeEach(() => {
    // APIレスポンスのモック
    (global.axios.get as jest.Mock).mockResolvedValue({
      data: {
        items: mockTraceData,
        total: 2
      }
    });
  });

  it('初期レンダリング時に必要なコンポーネントが表示される', async () => {
    render(<TraceabilityList />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  it('トレーサビリティデータが正しく表示される', async () => {
    render(<TraceabilityList />);

    await waitFor(() => {
      expect(screen.getByText('LOT001')).toBeInTheDocument();
      expect(screen.getByText('CBD Oil')).toBeInTheDocument();
      expect(screen.getByText('LOT002')).toBeInTheDocument();
      expect(screen.getByText('CBD Cream')).toBeInTheDocument();
    });
  });

  it('検索フィルターが正しく動作する', async () => {
    render(<TraceabilityList />);

    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('keyword=test')
      );
    });
  });

  it('ページネーションが正しく動作する', async () => {
    render(<TraceabilityList />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('新規登録ボタンクリック時に画面遷移する', async () => {
    render(<TraceabilityList />);

    const registerButton = screen.getByText('新規登録');
    fireEvent.click(registerButton);

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/traceability/register');
  });

  it('詳細表示リンクがクリックされた時に画面遷移する', async () => {
    render(<TraceabilityList />);

    await waitFor(() => {
      const detailLink = screen.getAllByText('詳細')[0];
      fireEvent.click(detailLink);
      expect(global.mockNextRouter.push).toHaveBeenCalledWith('/traceability/1');
    });
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    (global.axios.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    render(<TraceabilityList />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('ローディング中はスピナーが表示される', async () => {
    render(<TraceabilityList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('データが0件の場合に適切なメッセージが表示される', async () => {
    (global.axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [],
        total: 0
      }
    });

    render(<TraceabilityList />);

    await waitFor(() => {
      expect(screen.getByText('データが存在しません')).toBeInTheDocument();
    });
  });
});
```