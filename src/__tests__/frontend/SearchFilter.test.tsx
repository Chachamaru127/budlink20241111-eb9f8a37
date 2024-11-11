```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import SearchFilter from '@/app/SearchFilter/page'
import '@testing-library/jest-dom'

describe('SearchFilter', () => {
  const mockFilters = [
    {
      id: 'category',
      label: 'カテゴリー',
      type: 'select',
      options: [
        { value: 'cbd_oil', label: 'CBDオイル' },
        { value: 'cbd_tablet', label: 'CBDタブレット' }
      ]
    },
    {
      id: 'price',
      label: '価格帯',
      type: 'range',
      min: 0,
      max: 10000
    },
    {
      id: 'keyword',
      label: 'キーワード',
      type: 'text'
    }
  ]

  const mockOnFilter = jest.fn()

  beforeEach(() => {
    mockOnFilter.mockClear()
  })

  it('フィルターコンポーネントが正しくレンダリングされる', () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    expect(screen.getByText('カテゴリー')).toBeInTheDocument()
    expect(screen.getByText('価格帯')).toBeInTheDocument()
    expect(screen.getByText('キーワード')).toBeInTheDocument()
  })

  it('セレクトフィルターの選択が正しく動作する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const select = screen.getByLabelText('カテゴリー')
    fireEvent.change(select, { target: { value: 'cbd_oil' } })

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(expect.objectContaining({
        category: 'cbd_oil'
      }))
    })
  })

  it('価格範囲フィルターの入力が正しく動作する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const minInput = screen.getByLabelText('最小価格')
    const maxInput = screen.getByLabelText('最大価格')

    fireEvent.change(minInput, { target: { value: '1000' } })
    fireEvent.change(maxInput, { target: { value: '5000' } })

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(expect.objectContaining({
        price: { min: 1000, max: 5000 }
      }))
    })
  })

  it('キーワードフィルターの入力が正しく動作する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const input = screen.getByLabelText('キーワード')
    fireEvent.change(input, { target: { value: 'テスト' } })

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith(expect.objectContaining({
        keyword: 'テスト'
      }))
    })
  })

  it('フィルターのリセットが正しく動作する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const resetButton = screen.getByText('リセット')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith({
        category: '',
        price: { min: 0, max: 10000 },
        keyword: ''
      })
    })
  })

  it('フィルター適用ボタンが正しく動作する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)

    const input = screen.getByLabelText('キーワード')
    fireEvent.change(input, { target: { value: 'テスト' } })

    const applyButton = screen.getByText('適用')
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledTimes(2) // 入力時とボタンクリック時
    })
  })

  it('無効な価格入力に対してバリデーションが機能する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const minInput = screen.getByLabelText('最小価格')
    fireEvent.change(minInput, { target: { value: '-1000' } })

    expect(screen.getByText('0以上の値を入力してください')).toBeInTheDocument()
    expect(mockOnFilter).not.toHaveBeenCalled()
  })

  it('debounce処理が正しく機能する', async () => {
    jest.useFakeTimers()
    
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />)
    
    const input = screen.getByLabelText('キーワード')
    fireEvent.change(input, { target: { value: 'テ' } })
    fireEvent.change(input, { target: { value: 'テス' } })
    fireEvent.change(input, { target: { value: 'テスト' } })

    act(() => {
      jest.advanceTimersByTime(500) // debounce時間待機
    })

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledTimes(1)
      expect(mockOnFilter).toHaveBeenCalledWith(expect.objectContaining({
        keyword: 'テスト'
      }))
    })

    jest.useRealTimers()
  })
})
```