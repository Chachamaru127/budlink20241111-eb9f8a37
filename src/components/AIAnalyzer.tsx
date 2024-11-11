"use client"

import { useState, useEffect } from 'react';
import { IoWarning, IoCheckmarkCircle, IoSearch, IoArrowDown, IoArrowUp, IoClose } from 'react-icons/io5';
import { Dialog } from '@headlessui/react';

type AnalysisResult = {
  id: string;
  documentType: string;
  confidence: number;
  issues: string[];
  verified: boolean;
};

type AIAnalyzerProps = {
  analysisResults: AnalysisResult[];
  onVerify: (id: string) => void;
};

const AIAnalyzer = ({ analysisResults, onVerify }: AIAnalyzerProps) => {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setResults(analysisResults);
  }, [analysisResults]);

  const handleSort = () => {
    const sorted = [...results].sort((a, b) => {
      return sortOrder === 'asc' 
        ? a.confidence - b.confidence 
        : b.confidence - a.confidence;
    });
    setResults(sorted);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleFilter = (text: string) => {
    setFilterText(text);
    const filtered = analysisResults.filter(result => 
      result.documentType.toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  const handleBulkVerify = () => {
    results.forEach(result => {
      if (!result.verified) {
        onVerify(result.id);
      }
    });
  };

  const filteredResults = results.filter(result =>
    result.documentType.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">AI分析結果</h2>
            <div className="flex gap-4">
              <button
                onClick={handleSort}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                信頼度順
                {sortOrder === 'asc' ? <IoArrowUp /> : <IoArrowDown />}
              </button>
              <div className="relative">
                <IoSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="書類種別で検索"
                  className="pl-10 pr-4 py-2 border rounded-md"
                  onChange={(e) => handleFilter(e.target.value)}
                />
              </div>
              <button
                onClick={handleBulkVerify}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                一括確認
              </button>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">分析結果がありません</div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold">{result.documentType}</h3>
                      <span 
                        data-testid="confidence-value"
                        className={`px-2 py-1 rounded-full text-sm ${
                          result.confidence >= 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        onClick={() => {
                          setSelectedResult(result);
                          setIsModalOpen(true);
                        }}
                      >
                        詳細
                      </button>
                      {result.verified ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 rounded-md"
                        >
                          確認済み
                        </button>
                      ) : (
                        <button
                          onClick={() => onVerify(result.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          確認
                        </button>
                      )}
                    </div>
                  </div>
                  {result.issues.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <IoWarning data-testid={`warning-icon-${result.id}`} />
                        <span>{result.issues.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {result.confidence < 0.7 && (
                    <div className="mt-2 text-yellow-600 text-sm">
                      信頼度が低いため、手動確認を推奨
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div 
            data-testid="detail-modal"
            className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold">分析詳細情報</Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoClose size={24} />
              </button>
            </div>
            {selectedResult && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">書類種別</h4>
                  <p>{selectedResult.documentType}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">信頼度</h4>
                  <p>{Math.round(selectedResult.confidence * 100)}%</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">検出された問題</h4>
                  {selectedResult.issues.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {selectedResult.issues.map((issue, index) => (
                        <li key={index} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-600">問題は検出されませんでした</p>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AIAnalyzer;