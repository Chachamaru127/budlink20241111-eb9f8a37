"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'

const ProductsPage = () => {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
  }, [search, currentPage, sortBy, sortOrder])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*')
        .ilike('name', `%${search}%`)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      const { data, error } = await query

      if (error) throw error

      setProducts(data || [])
    } catch (err) {
      setError('データの読み込みに失敗しました')
      setProducts([
        {
          id: '1',
          name: 'サンプル商品1',
          description: '商品説明1',
          price: 1000,
          stock: 10,
          status: 'active'
        },
        {
          id: '2',
          name: 'サンプル商品2',
          description: '商品説明2',
          price: 2000,
          stock: 20,
          status: 'active'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product) => {
    router.push(`/products/${product.id}`)
  }

  const SearchFilter = ({ onFilter }) => (
    <div data-testid="search-filter" className="mb-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            data-testid="search-input"
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="商品名で検索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              onFilter({ search: e.target.value })
            }}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">商品名</option>
            <option value="price">価格</option>
            <option value="stock">在庫数</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">昇順</option>
            <option value="desc">降順</option>
          </select>
        </div>
      </div>
    </div>
  )

  const ProductCard = ({ product, onSelect }) => (
    <div
      data-testid={`product-card-${product.id}`}
      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(product)}
    >
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <img
          src={`https://placehold.co/300x200?text=${product.name}`}
          alt={product.name}
          className="object-cover rounded-md"
        />
      </div>
      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-blue-600">¥{product.price.toLocaleString()}</span>
        <span className={`px-2 py-1 rounded text-sm ${
          product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          在庫: {product.stock}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">商品一覧</h1>
        
        <SearchFilter onFilter={({ search }) => setSearch(search)} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FiChevronLeft className="inline mr-1" />
                前へ
              </button>
              <span className="text-gray-600">
                ページ {currentPage}
              </span>
              <button
                className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                次へ
                <FiChevronRight className="inline ml-1" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProductsPage