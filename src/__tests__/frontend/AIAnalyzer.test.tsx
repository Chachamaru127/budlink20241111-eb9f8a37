```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAnalyzer from '@/app/AIAnalyzer/page';
import '@testing-library/jest-dom';

const mockAnalysisResults = [
  {
    id: '1',
    documentType: '輸入許可証',
    confidence: 0.95,
    issues: [],
    verified: false
  },
  {
    id: '2', 
    documentType: '品質証明書',
    confidence: 0.85,
    issues: ['署名が不明瞭'],
    verified: false
  }
];

const mockOnVerify = jest.fn();

describe('AIAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('分析結果一覧が正しく表示される', () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    expect(screen.getByText('輸入許可証')).toBeInTheDocument();
    expect(screen.getByText('品質証明書')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('問題点がある場合に警告が表示される', () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    expect(screen.getByText('署名が不明瞭')).toBeInTheDocument();
    expect(screen.getByTestId('warning-icon-2')).toBeInTheDocument();
  });

  it('確認ボタンをクリックするとonVerifyが呼ばれる', async () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    const verifyButton = screen.getAllByText('確認')[0];
    await userEvent.click(verifyButton);
    
    expect(mockOnVerify).toHaveBeenCalledWith('1');
  });

  it('信頼度が閾値以下の場合に警告表示される', () => {
    const lowConfidenceResults = [{
      id: '3',
      documentType: '取引明細書',
      confidence: 0.65,
      issues: [],
      verified: false
    }];

    render(<AIAnalyzer analysisResults={lowConfidenceResults} onVerify={mockOnVerify} />);
    
    expect(screen.getByText('信頼度が低いため、手動確認を推奨')).toBeInTheDocument();
  });

  it('結果が空の場合適切なメッセージが表示される', () => {
    render(<AIAnalyzer analysisResults={[]} onVerify={mockOnVerify} />);
    
    expect(screen.getByText('分析結果がありません')).toBeInTheDocument();
  });

  it('確認済みの結果は確認ボタンが非活性になる', () => {
    const verifiedResults = [{
      id: '4',
      documentType: '請求書',
      confidence: 0.98,
      issues: [],
      verified: true
    }];

    render(<AIAnalyzer analysisResults={verifiedResults} onVerify={mockOnVerify} />);
    
    expect(screen.getByText('確認済み')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('ソート機能が正しく動作する', async () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    const sortButton = screen.getByText('信頼度順');
    await userEvent.click(sortButton);

    const confidenceValues = screen.getAllByTestId('confidence-value');
    expect(confidenceValues[0]).toHaveTextContent('95%');
    expect(confidenceValues[1]).toHaveTextContent('85%');
  });

  it('フィルター機能が正しく動作する', async () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    const filterInput = screen.getByPlaceholderText('書類種別で検索');
    await userEvent.type(filterInput, '輸入');

    expect(screen.getByText('輸入許可証')).toBeInTheDocument();
    expect(screen.queryByText('品質証明書')).not.toBeInTheDocument();
  });

  it('詳細表示が正しく動作する', async () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    const detailButton = screen.getAllByText('詳細')[0];
    await userEvent.click(detailButton);

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByText('分析詳細情報')).toBeInTheDocument();
  });

  it('一括確認機能が正しく動作する', async () => {
    render(<AIAnalyzer analysisResults={mockAnalysisResults} onVerify={mockOnVerify} />);
    
    const bulkVerifyButton = screen.getByText('一括確認');
    await userEvent.click(bulkVerifyButton);

    expect(mockOnVerify).toHaveBeenCalledTimes(2);
    expect(mockOnVerify).toHaveBeenCalledWith('1');
    expect(mockOnVerify).toHaveBeenCalledWith('2');
  });
});
```