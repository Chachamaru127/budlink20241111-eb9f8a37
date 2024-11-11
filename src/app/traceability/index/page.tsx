"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiSearch, FiPlus, FiChevronRight, FiLoader } from 'react-icons/fi'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'

const TraceabilityList = () => {
  const router = useRouter()
  const [traceData, setTraceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchTraceabilityData()
  }, [currentPage, searchTerm])

  const fetchTraceabilityData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('traceability')
        .select(`
          *,
          products (
            name,
            status
          )
        `)
        .ilike('lot_number', `%${searchTerm}%`)
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error
      setTraceData(data || [])
    } catch (err) {
      setError('データの取得に失敗しました')
      setTraceData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">トレーサビリティ情報一覧</h1>
          <Link href="/traceability/register" className="bg-[#2C5282] text-white px-4 py-2 rounded-md flex items-center hover:bg-opacity-90">
            <FiPlus className="mr-2" />
            新規登録
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6" data-testid="search-filter">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ロット番号で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-md pr-10"
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8" data-testid="loading-spinner">
              <FiLoader className="animate-spin text-3xl text-[#2C5282]" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : traceData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">データが存在しません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロット番号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">製品名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日時</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {traceData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lot_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.products?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.products?.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Link href={`/traceability/${item.id}`} className="text-[#2C5282] hover:text-opacity-80 flex items-center">
                          詳細
                          <FiChevronRight className="ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-center" data-testid="pagination">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                前へ
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 border rounded-md"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TraceabilityList