```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import QRGeneratorPage from '@/app/traceability/qr-generator/page';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// モック
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/QRGenerator', () => {
  return function MockQRGenerator({ data, onGenerate }: any) {
    return (
      <div data-testid="mock-qr-generator">
        <button onClick={() => onGenerate(data)}>Generate QR</button>
      </div>
    );
  };
});

jest.mock('@/components/PrintPreview', () => {
  return function MockPrintPreview({ content, onPrint }: any) {
    return (
      <div data-testid="mock-print-preview">
        <button onClick={onPrint}>Print</button>
      </div>
    );
  };
});

const mockProducts = [
  { id: 1, name: "Product 1", trace_info: "info1" },
  { id: 2, name: "Product 2", trace_info: "info2" }
];

describe('QRGeneratorPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('初期レンダリング時に商品一覧を取得して表示する', async () => {
    render(<QRGeneratorPage />);
    
    await waitFor(() => {
      expect(screen.getByText('商品を選択')).toBeInTheDocument();
    });
  });

  it('商品選択時にQRコード生成フォームが表示される', async () => {
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
    });

    expect(screen.getByTestId('mock-qr-generator')).toBeInTheDocument();
  });

  it('QRコード生成ボタンクリック時にAPIを呼び出す', async () => {
    const mockPost = jest.spyOn(global, 'fetch');
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
    });

    const generateButton = screen.getByText('Generate QR');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/qr-codes'),
      expect.any(Object)
    );
  });

  it('印刷プレビューが表示される', async () => {
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
    });

    const generateButton = screen.getByText('Generate QR');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    expect(screen.getByTestId('mock-print-preview')).toBeInTheDocument();
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    global.fetch = jest.fn(() => 
      Promise.reject(new Error('API Error'))
    ) as jest.Mock;

    render(<QRGeneratorPage />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('印刷ボタンクリック時に印刷ダイアログが開く', async () => {
    global.print = jest.fn();
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
    });

    const generateButton = screen.getByText('Generate QR');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    const printButton = screen.getByText('Print');
    fireEvent.click(printButton);

    expect(global.print).toHaveBeenCalled();
  });

  it('バッチ生成モードで複数QRコードを生成できる', async () => {
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const batchModeCheckbox = screen.getByRole('checkbox', { name: 'バッチ生成モード' });
      fireEvent.click(batchModeCheckbox);
    });

    const selectAll = screen.getByRole('checkbox', { name: '全て選択' });
    fireEvent.click(selectAll);

    const generateButton = screen.getByText('Generate QR');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/qr-codes/batch'),
      expect.any(Object)
    );
  });

  it('QRコードのダウンロードができる', async () => {
    const mockCreateObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    
    render(<QRGeneratorPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
    });

    const generateButton = screen.getByText('Generate QR');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    const downloadButton = screen.getByText('ダウンロード');
    fireEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
```