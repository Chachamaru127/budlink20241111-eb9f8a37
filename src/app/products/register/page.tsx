"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FiUpload } from 'react-icons/fi'
import { AiOutlineWarning } from 'react-icons/ai'

const ProductRegister = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.name) newErrors.name = '商品名は必須です'
    if (!formData.price) newErrors.price = '価格は必須です'
    if (Number(formData.price) < 0) newErrors.price = '価格は0以上の数値を入力してください'
    if (!formData.stock) newErrors.stock = '在庫数は必須です'
    if (Number(formData.stock) < 0) newErrors.stock = '在庫数は0以上の数値を入力してください'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          seller_id: (await supabase.auth.getUser()).data.user?.id,
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          stock: Number(formData.stock),
          status: 'active'
        }])
        .select()

      if (productError) throw productError

      setSubmitStatus('success')
      setTimeout(() => {
        router.push('/products')
      }, 2000)
    } catch (error) {
      setSubmitStatus('error')
    }
    setIsConfirmOpen(false)
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8">商品登録</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              商品名
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="商品名"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              商品説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="商品説明"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              商品画像
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  data-testid="image-uploader"
                />
                {preview ? (
                  <img src={preview} alt="プレビュー画像" className="mx-auto h-32 w-32 object-cover" />
                ) : (
                  <div className="mx-auto h-32 w-32 flex items-center justify-center">
                    <FiUpload className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <label
                  htmlFor="image"
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  画像をアップロード
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                価格
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="価格"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                在庫数
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="在庫数"
              />
              {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              登録する
            </button>
          </div>
        </form>

        {isConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">以下の内容で登録してよろしいですか？</h2>
              <div className="mb-4">
                <p><span className="font-medium">商品名:</span> {formData.name}</p>
                <p><span className="font-medium">価格:</span> ¥{formData.price}</p>
                <p><span className="font-medium">在庫数:</span> {formData.stock}</p>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md">
            商品を登録しました
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md">
            登録に失敗しました
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductRegister