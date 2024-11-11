"use client"

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa';

interface QRGeneratorProps {
  data: string;
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}

const QRGenerator: React.FC<QRGeneratorProps> = ({
  data,
  size,
  errorCorrection
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;

      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: size,
          errorCorrectionLevel: errorCorrection
        });
        setError(null);
      } catch (err) {
        setError('QRコードの生成に失敗しました');
        console.error('QRコード生成エラー:', err);
      }
    };

    generateQRCode();
  }, [data, size, errorCorrection]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-md">
      {error ? (
        <div className="flex items-center gap-2 text-red-600">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            data-testid="qr-canvas"
            width={size}
            height={size}
            className="border border-gray-200 rounded"
          />
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            <FaDownload />
            QRコードをダウンロード
          </button>
        </>
      )}
    </div>
  );
};

export default QRGenerator;