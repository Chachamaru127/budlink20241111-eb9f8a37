```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import AnalyticsFilter from '@/app/AnalyticsFilter/page';

const mockOnApply = jest.fn();

const defaultProps = {
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  metrics: ['売上', '注文数', '平均単価'],
  onApply: mockOnApply
};

describe('AnalyticsFilter', () => {
  beforeEach(() => {
    mockOnApply.mockClear();
  });

  it('初期表示時に渡されたdateRangeとmetricsが表示される', () => {
    render(<AnalyticsFilter {...defaultProps} />);
    
    expect(screen.getByRole('textbox', { name: /開始日/i })).toHaveValue('2024-01-01');
    expect(screen.getByRole('textbox', { name: /終了日/i })).toHaveValue('2024-01-31');
    
    defaultProps.metrics.forEach(metric => {
      expect(screen.getByRole('checkbox', { name: metric })).toBeInTheDocument();
    });
  });

  it('日付の入力が正しく動作する', async () => {
    render(<AnalyticsFilter {...defaultProps} />);
    
    const startDateInput = screen.getByRole('textbox', { name: /開始日/i });
    const endDateInput = screen.getByRole('textbox', { name: /終了日/i });

    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, '2024-02-01');
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2024-02-28');

    expect(startDateInput).toHaveValue('2024-02-01');
    expect(endDateInput).toHaveValue('2024-02-28');
  });

  it('メトリクスのチェックボックスが正しく動作する', async () => {
    render(<AnalyticsFilter {...defaultProps} />);

    const salesCheckbox = screen.getByRole('checkbox', { name: '売上' });
    const ordersCheckbox = screen.getByRole('checkbox', { name: '注文数' });

    await userEvent.click(salesCheckbox);
    await userEvent.click(ordersCheckbox);

    expect(salesCheckbox).not.toBeChecked();
    expect(ordersCheckbox).not.toBeChecked();
  });

  it('適用ボタンクリック時にonApplyが正しいパラメータで呼ばれる', async () => {
    render(<AnalyticsFilter {...defaultProps} />);

    const startDateInput = screen.getByRole('textbox', { name: /開始日/i });
    const endDateInput = screen.getByRole('textbox', { name: /終了日/i });
    const salesCheckbox = screen.getByRole('checkbox', { name: '売上' });

    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, '2024-02-01');
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2024-02-28');
    await userEvent.click(salesCheckbox);

    const applyButton = screen.getByRole('button', { name: /適用/i });
    await userEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith({
      dateRange: {
        startDate: '2024-02-01',
        endDate: '2024-02-28'
      },
      metrics: ['注文数', '平均単価']
    });
  });

  it('日付が不正な場合はエラーメッセージが表示される', async () => {
    render(<AnalyticsFilter {...defaultProps} />);

    const startDateInput = screen.getByRole('textbox', { name: /開始日/i });
    const endDateInput = screen.getByRole('textbox', { name: /終了日/i });

    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, '2024-02-28');
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2024-02-01');

    const applyButton = screen.getByRole('button', { name: /適用/i });
    await userEvent.click(applyButton);

    expect(screen.getByText('終了日は開始日より後の日付を選択してください')).toBeInTheDocument();
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it('メトリクスが1つも選択されていない場合はエラーメッセージが表示される', async () => {
    render(<AnalyticsFilter {...defaultProps} />);

    defaultProps.metrics.forEach(async metric => {
      const checkbox = screen.getByRole('checkbox', { name: metric });
      await userEvent.click(checkbox);
    });

    const applyButton = screen.getByRole('button', { name: /適用/i });
    await userEvent.click(applyButton);

    expect(screen.getByText('1つ以上のメトリクスを選択してください')).toBeInTheDocument();
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it('リセットボタンクリック時に初期値に戻る', async () => {
    render(<AnalyticsFilter {...defaultProps} />);

    const startDateInput = screen.getByRole('textbox', { name: /開始日/i });
    const endDateInput = screen.getByRole('textbox', { name: /終了日/i });
    const salesCheckbox = screen.getByRole('checkbox', { name: '売上' });

    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, '2024-02-01');
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2024-02-28');
    await userEvent.click(salesCheckbox);

    const resetButton = screen.getByRole('button', { name: /リセット/i });
    await userEvent.click(resetButton);

    expect(startDateInput).toHaveValue('2024-01-01');
    expect(endDateInput).toHaveValue('2024-01-31');
    expect(salesCheckbox).toBeChecked();
  });
});
```