"use client"

import React, { useEffect, useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';

type ConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmDisabled = false,
  confirmLabel = "確認",
  cancelLabel = "キャンセル"
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onCancel();
    }
  }, [isOpen, onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const handleConfirm = () => {
    if (isAnimating || confirmDisabled) return;
    setIsAnimating(true);
    onConfirm();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleCancel = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    onCancel();
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
    >
      <div
        data-testid="dialog-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          aria-label="閉じる"
        >
          <IoClose size={24} />
        </button>

        <div className="mt-3 text-center sm:mt-0 sm:text-left">
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm ${
              confirmDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;