"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FaPrint, FaDownload, FaQrcode } from 'react-icons/fa'

export default function QRGeneratorPage() {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qrData, setQrData] = useState(null)
  const [error, setError] = useState('')
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, trace_info')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError('商品データの取得に失敗しました')
      setProducts([
        { id: 1, name: "サンプル商品1", trace_info: "info1" },
        { id: 2, name: "サンプル商品2", trace_info: "info2" }
      ])
    }
  }

  async function generateQR(productId) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/qr-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId })
      })
      
      if (!response.ok) throw new Error('QRコード生成に失敗しました')
      
      const data = await response.json()
      setQrData(data)
    } catch (err) {
      setError('QRコードの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  async function generateBatchQR() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/qr-generator/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts })
      })
      
      if (!response.ok) throw new Error('バッチQRコード生成に失敗しました')
      
      const data = await response.json()
      setQrData(data)
    } catch (err) {
      setError('バッチQRコードの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = url
      link.click()
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">QRコード生成</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            エラーが発生しました: {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isBatchMode}
                onChange={(e) => setIsBatchMode(e.target.checked)}
              />
              <span className="ml-2">バッチ生成モード</span>
            </label>
          </div>

          {!isBatchMode ? (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">商品を選択</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">選択してください</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              
              <button
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
                onClick={() => generateQR(selectedProduct)}
                disabled={!selectedProduct || isLoading}
              >
                <FaQrcode className="mr-2" />
                QRコード生成
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id))
                      } else {
                        setSelectedProducts([])
                      }
                    }}
                  />
                  <span className="ml-2">全て選択</span>
                </label>
              </div>
              
              {products.map((product) => (
                <div key={product.id} className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id])
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                        }
                      }}
                    />
                    <span className="ml-2">{product.name}</span>
                  </label>
                </div>
              ))}
              
              <button
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
                onClick={generateBatchQR}
                disabled={selectedProducts.length === 0 || isLoading}
              >
                <FaQrcode className="mr-2" />
                バッチQRコード生成
              </button>
            </div>
          )}

          {qrData && (
            <div className="mt-8">
              <div className="mb-4">
                <QRCode value={JSON.stringify(qrData)} size={200} />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handlePrint}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center"
                >
                  <FaPrint className="mr-2" />
                  印刷
                </button>
                
                <button
                  onClick={handleDownload}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  ダウンロード
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}