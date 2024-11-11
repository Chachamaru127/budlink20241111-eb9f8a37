```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QRGenerator from '@/app/QRGenerator/page';
import QRCode from 'qrcode';
import { act } from 'react-dom/test-utils';

jest.mock('qrcode', () => ({
  toCanvas: jest.fn(),
}));

describe('QRGenerator', () => {
  const mockProps = {
    data: 'test-data',
    size: 200,
    errorCorrection: 'M' as 'L' | 'M' | 'Q' | 'H'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しくレンダリングされること', () => {
    render(<QRGenerator {...mockProps} />);
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('QRコードが生成されること', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValueOnce({});
    
    render(<QRGenerator {...mockProps} />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'test-data',
        {
          width: 200,
          errorCorrectionLevel: 'M'
        }
      );
    });
  });

  it('エラー時にエラーメッセージが表示されること', async () => {
    const error = new Error('QRコード生成エラー');
    (QRCode.toCanvas as jest.Mock).mockRejectedValueOnce(error);

    render(<QRGenerator {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('QRコードの生成に失敗しました')).toBeInTheDocument();
    });
  });

  it('propsの変更で再レンダリングされること', async () => {
    const { rerender } = render(<QRGenerator {...mockProps} />);

    const newProps = {
      ...mockProps,
      data: 'new-test-data',
      size: 300,
      errorCorrection: 'H' as 'L' | 'M' | 'Q' | 'H'
    };

    await act(async () => {
      rerender(<QRGenerator {...newProps} />);
    });

    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'new-test-data',
        {
          width: 300,
          errorCorrectionLevel: 'H'
        }
      );
    });
  });

  it('キャンバス要素が正しいサイズで生成されること', () => {
    render(<QRGenerator {...mockProps} />);
    const canvas = screen.getByTestId('qr-canvas');
    expect(canvas).toHaveAttribute('width', '200');
    expect(canvas).toHaveAttribute('height', '200');
  });

  it('ダウンロードボタンが機能すること', async () => {
    global.URL.createObjectURL = jest.fn();
    const mockLink = { click: jest.fn(), href: '', download: '' };
    jest.spyOn(document, 'createElement').mockImplementation((element) => {
      if (element === 'a') return mockLink as any;
      return document.createElement(element);
    });

    render(<QRGenerator {...mockProps} />);
    
    const downloadButton = screen.getByText('QRコードをダウンロード');
    fireEvent.click(downloadButton);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('qrcode.png');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('エラー補正レベルが正しく適用されること', async () => {
    const testCases = [
      { errorCorrection: 'L' as const },
      { errorCorrection: 'M' as const },
      { errorCorrection: 'Q' as const },
      { errorCorrection: 'H' as const }
    ];

    for (const testCase of testCases) {
      const props = { ...mockProps, errorCorrection: testCase.errorCorrection };
      
      render(<QRGenerator {...props} />);
      
      await waitFor(() => {
        expect(QRCode.toCanvas).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          'test-data',
          expect.objectContaining({
            errorCorrectionLevel: testCase.errorCorrection
          })
        );
      });
    }
  });
});
```