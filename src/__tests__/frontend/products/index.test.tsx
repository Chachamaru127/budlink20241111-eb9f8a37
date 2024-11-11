```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import ProductsPage from '@/app/products/index/page'
import userEvent from '@testing-library/user-event'

const mockProducts = [
  {
    id: '1',
    name: 'テスト商品1',
    description: '商品説明1',
    price: 1000,
    stock: 10,
    status: 'active'
  },
  {
    id: '2', 
    name: 'テスト商品2',
    description: '商品説明2',
    price: 2000,
    stock: 20,
    status: 'active'
  }
]

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">ヘッダー</div>
  }
})

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">サイドバー</div>
  }
})

jest.mock('@/components/ProductCard', () => {
  return function MockProductCard({ product, onSelect }: any) {
    return (
      <div data-testid={`product-card-${product.id}`} onClick={() => onSelect(product)}>
        {product.name}
      </div>
    )
  }
})

jest.mock('@/components/SearchFilter', () => {
  return function MockSearchFilter({ onFilter }: any) {
    return (
      <div data-testid="search-filter">
        <input 
          data-testid="search-input"
          onChange={(e) => onFilter({ search: e.target.value })}
        />
      </div>
    )
  }
})

describe('商品一覧ページ', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ products: mockProducts }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('商品一覧が正しく表示される', async () => {
    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument()
    })

    expect(screen.getByText('テスト商品1')).toBeInTheDocument()
    expect(screen.getByText('テスト商品2')).toBeInTheDocument()
  })

  test('検索フィルターが機能する', async () => {
    render(<ProductsPage />)

    const searchInput = await screen.findByTestId('search-input')
    await userEvent.type(searchInput, 'テスト商品1')

    await waitFor(() => {
      expect(screen.getByText('テスト商品1')).toBeInTheDocument()
      expect(screen.queryByText('テスト商品2')).not.toBeInTheDocument()
    })
  })

  test('商品カードクリックで詳細画面に遷移する', async () => {
    render(<ProductsPage />)

    const productCard = await screen.findByTestId('product-card-1')
    await userEvent.click(productCard)

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/products/1')
  })

  test('データ取得エラー時にエラーメッセージが表示される', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('データ取得に失敗しました'))
    ) as jest.Mock

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument()
    })
  })

  test('ローディング状態が表示される', async () => {
    render(<ProductsPage />)
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
  })

  test('共通コンポーネントが正しく表示される', () => {
    render(<ProductsPage />)

    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('search-filter')).toBeInTheDocument()
  })

  test('ページネーションが機能する', async () => {
    const manyProducts = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      name: `テスト商品${i + 1}`,
      description: `商品説明${i + 1}`,
      price: 1000 * (i + 1),
      stock: 10 * (i + 1),
      status: 'active'
    }))

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ products: manyProducts }),
      })
    ) as jest.Mock

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getAllByTestId(/product-card-/)).toHaveLength(10)
    })

    const nextButton = screen.getByText('次へ')
    await userEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByTestId('product-card-11')).toBeInTheDocument()
    })
  })
})
```