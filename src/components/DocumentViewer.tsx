"use client"

import { useState, useEffect } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCw, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type DocumentViewerProps = {
  documentUrl: string;
  type: string;
};

const DocumentViewer = ({ documentUrl, type }: DocumentViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'text') {
      fetchTextContent();
    } else {
      setLoading(false);
    }
  }, [documentUrl, type]);

  const fetchTextContent = async () => {
    try {
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error('読み込みエラー');
      const text = await response.text();
      setTextContent(text);
      setLoading(false);
    } catch (err) {
      setError('ドキュメントの読み込みに失敗しました。');
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => prev + 0.1);
  const handleZoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.1));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleNextPage = () => setPage(prev => prev + 1);
  const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = 'document';
    link.click();
  };

  if (!['pdf', 'image', 'text'].includes(type)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">サポートされていないファイル形式です。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-spinner">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-4 bg-gray-100">
        <div className="flex gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded hover:bg-gray-200"
            aria-label="拡大"
          >
            <FiZoomIn />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded hover:bg-gray-200"
            aria-label="縮小"
          >
            <FiZoomOut />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded hover:bg-gray-200"
            aria-label="回転"
          >
            <FiRotateCw />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-gray-200"
            aria-label="ダウンロード"
          >
            <FiDownload />
          </button>
        </div>
        {type === 'pdf' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              className="p-2 rounded hover:bg-gray-200"
              aria-label="前のページ"
            >
              <FiChevronLeft />
            </button>
            <span>ページ: {page}</span>
            <button
              onClick={handleNextPage}
              className="p-2 rounded hover:bg-gray-200"
              aria-label="次のページ"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div
          data-testid="document-container"
          data-url={documentUrl}
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease'
          }}
        >
          {type === 'pdf' && (
            <div data-testid="pdf-viewer" className="w-full h-full">
              <iframe src={documentUrl} className="w-full h-full" />
            </div>
          )}
          {type === 'image' && (
            <img src={documentUrl} alt="document" className="max-w-full max-h-full" />
          )}
          {type === 'text' && (
            <div className="w-full h-full bg-white p-4 overflow-auto">
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;