```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '@/app/Footer/page';

const mockLinks = [
  {
    id: 1,
    label: '会社概要',
    url: '/about'
  },
  {
    id: 2,
    label: '利用規約',
    url: '/terms'
  },
  {
    id: 3, 
    label: 'プライバシーポリシー',
    url: '/privacy'
  }
];

describe('Footer', () => {
  test('フッターが正しくレンダリングされること', () => {
    render(<Footer links={mockLinks} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('全てのリンクが表示されていること', () => {
    render(<Footer links={mockLinks} />);
    
    mockLinks.forEach(link => {
      const linkElement = screen.getByText(link.label);
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', link.url);
    });
  });

  test('空のリンク配列でもレンダリングされること', () => {
    render(<Footer links={[]} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('コピーライトテキストが表示されていること', () => {
    render(<Footer links={mockLinks} />);
    expect(screen.getByText(/© 2024 BudLink. All rights reserved./)).toBeInTheDocument();
  });

  test('リンククリック時の挙動が正しいこと', () => {
    render(<Footer links={mockLinks} />);
    
    mockLinks.forEach(link => {
      const linkElement = screen.getByText(link.label);
      fireEvent.click(linkElement);
      // リンククリック時のデフォルト挙動を確認
      expect(linkElement).toHaveAttribute('href', link.url);
    });
  });

  test('フッターのスタイルが適用されていること', () => {
    render(<Footer links={mockLinks} />);
    const footer = screen.getByRole('contentinfo');
    
    expect(footer).toHaveClass('bg-gray-100');
    expect(footer).toHaveClass('py-8');
  });

  test('リンクリストのレイアウトが正しいこと', () => {
    render(<Footer links={mockLinks} />);
    const linkList = screen.getByRole('list');
    
    expect(linkList).toHaveClass('flex');
    expect(linkList).toHaveClass('justify-center');
  });

  test('各リンクアイテムのスタイルが適用されていること', () => {
    render(<Footer links={mockLinks} />);
    
    mockLinks.forEach(link => {
      const linkElement = screen.getByText(link.label);
      expect(linkElement).toHaveClass('text-gray-600');
      expect(linkElement).toHaveClass('hover:text-gray-900');
    });
  });
});
```