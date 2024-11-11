```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DemandForecast from '@/app/analytics/demand-forecast/page';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// モックデータ
const mockForecastData = {
  dates: ['2024-01', '2024-02', '2024-03'],
  values: [100, 120, 140],
  predictions: [150, 160, 170]
};

const mockSalesData = {
  history: [
    { date: '2023-12', amount: 90 },
    { date: '2023-11', amount: 85 },
    { date: '2023-10', amount: 95 }
  ]
};

// APIモック
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mockSalesData })),
  post: jest.fn(() => Promise.resolve({ data: mockForecastData }))
}));

describe('DemandForecast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期レンダリング時に必要なコンポーネントが表示される', async () => {
    render(<DemandForecast />);

    expect(screen.getByText('需要予測')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '予測実行' })).toBeInTheDocument();
    expect(screen.getByLabelText('分析期間')).toBeInTheDocument();
    expect(screen.getByLabelText('予測モデル')).toBeInTheDocument();
  });

  it('パラメータ入力後に予測が実行される', async () => {
    render(<DemandForecast />);

    const periodSelect = screen.getByLabelText('分析期間');
    const modelSelect = screen.getByLabelText('予測モデル');
    const executeButton = screen.getByRole('button', { name: '予測実行' });

    await act(async () => {
      await userEvent.selectOptions(periodSelect, '6');
      await userEvent.selectOptions(modelSelect, 'arima');
      fireEvent.click(executeButton);
    });

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalledWith(
        '/api/forecasts/predict',
        expect.any(Object)
      );
    });
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    global.axios.post.mockRejectedValueOnce(new Error('予測に失敗しました'));
    
    render(<DemandForecast />);
    
    const executeButton = screen.getByRole('button', { name: '予測実行' });

    await act(async () => {
      fireEvent.click(executeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('予測の実行に失敗しました')).toBeInTheDocument();
    });
  });

  it('グラフが正しく表示される', async () => {
    render(<DemandForecast />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '予測実行' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
    });
  });

  it('CSVエクスポートが機能する', async () => {
    const mockCreateObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    
    render(<DemandForecast />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '予測実行' }));
    });

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: 'CSVエクスポート' });
      fireEvent.click(exportButton);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  it('パラメータバリデーションが機能する', async () => {
    render(<DemandForecast />);

    const executeButton = screen.getByRole('button', { name: '予測実行' });

    await act(async () => {
      fireEvent.click(executeButton);
    });

    expect(screen.getByText('分析期間を選択してください')).toBeInTheDocument();
    expect(screen.getByText('予測モデルを選択してください')).toBeInTheDocument();
  });

  it('ローディング状態が表示される', async () => {
    render(<DemandForecast />);

    const executeButton = screen.getByRole('button', { name: '予測実行' });

    await act(async () => {
      fireEvent.click(executeButton);
    });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```