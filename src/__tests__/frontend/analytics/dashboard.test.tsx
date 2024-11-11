```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import AnalyticsDashboard from '@/app/analytics/dashboard/page'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// モックデータ
const mockTransactionData = {
  transactions: [
    { id: 1, date: '2024-01-01', amount: 10000, product: 'CBD Oil' },
    { id: 2, date: '2024-01-02', amount: 15000, product: 'CBD Cream' }
  ],
  salesData: {
    totalSales: 25000,
    averageOrderValue: 12500,
    topProducts: ['CBD Oil', 'CBD Cream']
  }
}

// モックコンポーネント
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>
  }
})

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>
  }
})

jest.mock('@/components/Charts', () => {
  return function MockCharts({ data, type }) {
    return <div data-testid="mock-charts">{type}: {JSON.stringify(data)}</div>
  }
})

jest.mock('@/components/AnalyticsFilter', () => {
  return function MockAnalyticsFilter({ onApply }) {
    return (
      <button data-testid="filter-apply" onClick={() => onApply({ 
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      })}>
        Apply Filter
      </button>
    )
  }
})

// APIモック
jest.mock('axios')

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    global.axios.get.mockResolvedValue({ data: mockTransactionData })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('正しくレンダリングされること', async () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-charts')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText(/Total Sales: ¥25,000/)).toBeInTheDocument()
    })
  })

  it('フィルター適用時にデータが更新されること', async () => {
    render(<AnalyticsDashboard />)
    
    const filterButton = screen.getByTestId('filter-apply')
    fireEvent.click(filterButton)
    
    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01')
      )
    })
  })

  it('エクスポートボタンクリック時にPDFがダウンロードされること', async () => {
    global.axios.post.mockResolvedValueOnce({
      data: { downloadUrl: 'http://example.com/report.pdf' }
    })

    render(<AnalyticsDashboard />)
    
    const exportButton = screen.getByText('レポートをエクスポート')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalledWith(
        '/api/analytics/export',
        expect.any(Object)
      )
    })
  })

  it('エラー時にエラーメッセージが表示されること', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('API Error'))
    
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
    })
  })

  it('日付範囲の変更が正しく機能すること', async () => {
    render(<AnalyticsDashboard />)

    const dateRangeSelector = screen.getByRole('combobox', { name: '期間' })
    await userEvent.selectOptions(dateRangeSelector, '30days')

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith(
        expect.stringContaining('period=30days')
      )
    })
  })

  it('グラフタイプの切り替えが正しく機能すること', async () => {
    render(<AnalyticsDashboard />)

    const chartTypeButton = screen.getByRole('button', { name: '棒グラフ' })
    fireEvent.click(chartTypeButton)

    const updatedChart = await screen.findByTestId('mock-charts')
    expect(updatedChart).toHaveTextContent('bar:')
  })
})
```