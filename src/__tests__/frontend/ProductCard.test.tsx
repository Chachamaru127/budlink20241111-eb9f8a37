```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductCard from '@/app/ProductCard/page';
import { jest } from '@jest/globals';

const mockProduct = {
  id: '1',
  name: 'CBDオイル',
  description: '高品質なCBDオイル。THC含有量0.3%未満。',
  price: 5000,
  stock: 100,
  imageUrl: '/images/cbd-oil.jpg',
  status: '販売中',
  manufacturerName: 'CBDメーカー',
  rating: 4.5,
  category: 'オイル'
};

const mockOnSelect = jest.fn();

describe('ProductCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商品情報が正しく表示される', () => {
    render(<ProductCard product={mockProduct} onSelect={mockOnSelect} />);

    expect(screen.getByText('CBDオイル')).toBeInTheDocument();
    expect(screen.getByText(/5,000円/)).toBeInTheDocument();
    expect(screen.getByText('在庫: 100')).toBeInTheDocument();
    expect(screen.getByText('CBDメーカー')).toBeInTheDocument();
    expect(screen.getByAltText('CBDオイル')).toHaveAttribute('src', '/images/cbd-oil.jpg');
  });

  it('商品カードをクリックするとonSelect関数が呼ばれる', () => {
    render(<ProductCard product={mockProduct} onSelect={mockOnSelect} />);
    
    const card = screen.getByTestId('product-card');
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('在庫切れ商品は在庫切れバッジが表示される', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0, status: '在庫切れ' };
    
    render(<ProductCard product={outOfStockProduct} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('在庫切れ')).toHaveClass('bg-red-500');
  });

  it('セール商品はセールバッジが表示される', () => {
    const saleProduct = { ...mockProduct, status: 'セール中' };
    
    render(<ProductCard product={saleProduct} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('セール中')).toHaveClass('bg-orange-500');
  });

  it('商品画像のロードエラー時に代替画像が表示される', async () => {
    render(<ProductCard product={mockProduct} onSelect={mockOnSelect} />);
    
    const img = screen.getByAltText('CBDオイル');
    fireEvent.error(img);
    
    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/images/product-placeholder.png');
    });
  });

  it('商品評価が正しく表示される', () => {
    render(<ProductCard product={mockProduct} onSelect={mockOnSelect} />);
    
    const ratingStars = screen.getAllByTestId('rating-star');
    expect(ratingStars).toHaveLength(5);
    
    const filledStars = ratingStars.filter(star => 
      star.classList.contains('text-yellow-400')
    );
    expect(filledStars).toHaveLength(4);
  });

  it('商品説明が長い場合は省略される', () => {
    const longDescProduct = {
      ...mockProduct,
      description: 'これは非常に長い商品説明です。'.repeat(10)
    };
    
    render(<ProductCard product={longDescProduct} onSelect={mockOnSelect} />);
    
    const description = screen.getByTestId('product-description');
    expect(description.textContent?.length).toBeLessThanOrEqual(100);
    expect(description.textContent).toMatch(/\.\.\.$/);
  });

  it('価格が正しいフォーマットで表示される', () => {
    const highPriceProduct = { ...mockProduct, price: 1000000 };
    
    render(<ProductCard product={highPriceProduct} onSelect={mockOnSelect} />);
    
    expect(screen.getByTestId('product-price')).toHaveTextContent('1,000,000円');
  });
});
```