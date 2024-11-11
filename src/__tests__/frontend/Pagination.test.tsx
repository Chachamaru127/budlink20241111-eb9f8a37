```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { jest } from '@jest/globals'
import Pagination from '@/app/Pagination/page'

describe('Paginationコンポーネント', () => {
  const mockOnPageChange = jest.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  test('現在のページと総ページ数が正しく表示される', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={10} 
        onPageChange={mockOnPageChange} 
      />
    )
    
    expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  test('前へ/次へボタンが正しく動作する', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    fireEvent.click(screen.getByLabelText('前のページへ'))
    expect(mockOnPageChange).toHaveBeenCalledWith(4)

    fireEvent.click(screen.getByLabelText('次のページへ'))
    expect(mockOnPageChange).toHaveBeenCalledWith(6)
  })

  test('最初のページで前へボタンが無効になる', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByLabelText('前のページへ')).toBeDisabled()
  })

  test('最後のページで次へボタンが無効になる', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByLabelText('次のページへ')).toBeDisabled()
  })

  test('ページ番号をクリックして移動できる', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    fireEvent.click(screen.getByText('3'))
    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  test('表示するページ番号が7個以下に制限される', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />
    )

    const pageButtons = screen.getAllByRole('button').filter(
      button => !isNaN(Number(button.textContent))
    )
    expect(pageButtons.length).toBeLessThanOrEqual(7)
  })

  test('省略記号(...)が適切に表示される', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />
    )

    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBe(2)
  })

  test('不正なページ番号が渡された場合にエラーを表示する', () => {
    render(
      <Pagination
        currentPage={-1}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('ページ番号が不正です')).toBeInTheDocument()
  })

  test('総ページ数が0以下の場合にエラーを表示する', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={0}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('ページ情報が不正です')).toBeInTheDocument()
  })

  test('現在のページが総ページ数を超えている場合にエラーを表示する', () => {
    render(
      <Pagination
        currentPage={11}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('ページ番号が不正です')).toBeInTheDocument()
  })
})
```