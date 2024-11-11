```typescript
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/app/StatusBadge/page';

describe('StatusBadgeコンポーネント', () => {
  test('successタイプのバッジが正しく表示される', () => {
    render(<StatusBadge status="完了" type="success" />);
    
    const badge = screen.getByTestId('status-badge');
    const text = screen.getByText('完了');
    
    expect(badge).toHaveClass('bg-green-500');
    expect(text).toBeInTheDocument();
  });

  test('warningタイプのバッジが正しく表示される', () => {
    render(<StatusBadge status="進行中" type="warning" />);
    
    const badge = screen.getByTestId('status-badge');
    const text = screen.getByText('進行中');
    
    expect(badge).toHaveClass('bg-yellow-500');
    expect(text).toBeInTheDocument();
  });

  test('errorタイプのバッジが正しく表示される', () => {
    render(<StatusBadge status="エラー" type="error" />);
    
    const badge = screen.getByTestId('status-badge');
    const text = screen.getByText('エラー');
    
    expect(badge).toHaveClass('bg-red-500'); 
    expect(text).toBeInTheDocument();
  });

  test('デフォルトスタイルが適用される', () => {
    render(<StatusBadge status="テスト" type="success" />);
    
    const badge = screen.getByTestId('status-badge');
    
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-white');
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('font-medium');
  });

  test('長いステータステキストが正しく表示される', () => {
    const longStatus = '非常に長いステータステキストです';
    render(<StatusBadge status={longStatus} type="success" />);
    
    const text = screen.getByText(longStatus);
    expect(text).toBeInTheDocument();
  });

  test('空のステータスが正しく処理される', () => {
    render(<StatusBadge status="" type="success" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeEmptyDOMElement();
  });
});
```