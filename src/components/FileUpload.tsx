"use client"

import { useState, useCallback, useRef } from 'react'
import { FiUploadCloud } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

type FileUploadProps = {
  onUpload: (file: File) => void | Promise<void>
  acceptedTypes: string[]
  maxSize: number
}

export default function FileUpload({ onUpload, acceptedTypes, maxSize }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError('')
    
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!acceptedTypes.includes(fileExtension)) {
      setError('対応していないファイル形式です')
      return false
    }

    if (file.size > maxSize) {
      setError('ファイルサイズが制限を超えています')
      return false
    }

    return true
  }

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return

    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        await handleFile(file)
      }
    },
    [onUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  return (
    <div className="w-full">
      <div
        data-testid="drop-zone"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center
          min-h-[200px] cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50 drag-active' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input
          data-testid="file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept={acceptedTypes.join(',')}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <AiOutlineLoading3Quarters className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
          </div>
        ) : (
          <>
            <FiUploadCloud className="w-12 h-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">ファイルをドラッグ＆ドロップ</p>
            <p className="mt-1 text-xs text-gray-500">
              または クリックしてファイルを選択
            </p>
            <p className="mt-2 text-xs text-gray-500">
              対応形式: {acceptedTypes.join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              最大サイズ: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}