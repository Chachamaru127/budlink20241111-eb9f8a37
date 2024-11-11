```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '@/app/Sidebar/page';
import { useRouter } from 'next/navigation';

// モックデータ
const mockMenuItems = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'products', 
    label: '商品管理',
    icon: 'inventory',
    path: '/products'
  },
  {
    id: 'orders',
    label: '受注管理', 
    icon: 'shopping_cart',
    path: '/orders'
  }
];

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

describe('Sidebar', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('メニュー項目が正しく表示されること', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('商品管理')).toBeInTheDocument();
    expect(screen.getByText('受注管理')).toBeInTheDocument();
  });

  it('アクティブなメニュー項目が正しくハイライトされること', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="products" />);
    
    const activeItem = screen.getByText('商品管理').closest('li');
    expect(activeItem).toHaveClass('active');
  });

  it('メニュー項目クリック時に正しいパスに遷移すること', async () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);

    await userEvent.click(screen.getByText('商品管理'));
    expect(mockRouter.push).toHaveBeenCalledWith('/products');
  });

  it('空のメニュー項目配列が渡された場合にエラーが発生しないこと', () => {
    render(<Sidebar menuItems={[]} activeItem="" />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('サイドバーの開閉が正しく動作すること', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);
    
    expect(screen.getByRole('navigation')).toHaveClass('collapsed');
    
    fireEvent.click(toggleButton);
    expect(screen.getByRole('navigation')).not.toHaveClass('collapsed');
  });

  it('アイコンが正しく表示されること', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);
    
    const icons = screen.getAllByTestId('menu-icon');
    expect(icons).toHaveLength(mockMenuItems.length);
    expect(icons[0]).toHaveTextContent('dashboard');
  });

  it('モバイル表示時にメニューが正しく表示・非表示されること', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);
    
    // ビューポートをモバイルサイズに変更
    window.innerWidth = 480;
    fireEvent(window, new Event('resize'));
    
    const mobileMenuButton = screen.getByRole('button', { name: /mobile menu/i });
    fireEvent.click(mobileMenuButton);
    
    expect(screen.getByRole('navigation')).toHaveClass('mobile-visible');
  });

  it('不正なactiveItemが渡された場合にエラーが発生しないこと', () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="invalid-id" />);
    
    mockMenuItems.forEach(item => {
      const menuItem = screen.getByText(item.label).closest('li');
      expect(menuItem).not.toHaveClass('active');
    });
  });

  it('メニュー項目のホバー状態が正しく適用されること', async () => {
    render(<Sidebar menuItems={mockMenuItems} activeItem="dashboard" />);
    
    const menuItem = screen.getByText('商品管理').closest('li');
    await userEvent.hover(menuItem as HTMLElement);
    
    expect(menuItem).toHaveClass('hover');
    
    await userEvent.unhover(menuItem as HTMLElement);
    expect(menuItem).not.toHaveClass('hover');
  });
});
```