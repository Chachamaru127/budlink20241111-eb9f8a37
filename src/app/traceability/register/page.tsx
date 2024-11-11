"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IoDocumentText, IoCloudUpload, IoWarning } from 'react-icons/io5'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'

export default function TraceabilityRegister() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    productName: '',
    lotNumber: '',
  })
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('製品データの取得に失敗しました:', error)
      setProducts([])
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.productName) newErrors.productName = '製品名は必須です'
    if (!formData.lotNumber) newErrors.lotNumber = 'ロット番号は必須です'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (uploadedFiles) => {
    setFiles(Array.from(uploadedFiles))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      setIsConfirmOpen(true)
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('traceability')
        .insert([
          {
            product_id: formData.productName,
            lot_number: formData.lotNumber,
            coa_data: {},
            import_info: {}
          }
        ])

      if (error) throw error
      router.push('/traceability/list')
    } catch (error) {
      console.error('登録に失敗しました:', error)
      setErrorMessage('登録に失敗しました')
    } finally {
      setIsLoading(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">トレーサビリティ情報登録</h1>
          
          <form onSubmit={handleSubmit} data-testid="traceability-form">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700" htmlFor="productName">
                製品名
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="製品名"
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700" htmlFor="lotNumber">
                ロット番号
              </label>
              <input
                type="text"
                id="lotNumber"
                name="lotNumber"
                value={formData.lotNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="ロット番号"
              />
              {errors.lotNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.lotNumber}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                書類アップロード
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                data-testid="mock-file-upload"
              />
              <div className="mt-2">
                {files.map((file, index) => (
                  <div key={index} className="text-sm text-gray-600">{file.name}</div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 rounded-md">
                <p className="text-red-600">{errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/traceability/list')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                disabled={isLoading}
              >
                登録する
              </button>
            </div>
          </form>
        </div>

        {isConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" data-testid="mock-confirm-dialog">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">登録確認</h3>
              <p className="text-gray-600 mb-6">入力内容を確認し、登録を実行しますか？</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}