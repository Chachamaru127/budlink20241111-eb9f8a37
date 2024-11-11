"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaDownload, FaSearch, FaFilter } from 'react-icons/fa'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'

type Payment = {
  id: string
  amount: number
  status: string
  date: string
  paymentMethod: string
}

type Transaction = {
  id: string
  type: string
  amount: number
  date: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [statusFilter, startDate, endDate, currentPage])

  const fetchData = async () => {
    try {
      let { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false })

      if (paymentsError) throw paymentsError

      let { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError

      setPayments(paymentsData || [])
      setTransactions(transactionsData || [])
    } catch (error) {
      setError('データの取得に失敗しました')
      // フォールバックデータ
      setPayments([
        {
          id: 'p1',
          amount: 10000,
          status: '完了',
          date: '2024-01-01',
          paymentMethod: 'クレジットカード'
        }
      ])
      setTransactions([
        {
          id: 't1',
          type: '入金',
          amount: 10000,
          date: '2024-01-01'
        }
      ])
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/payments/download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '決済明細.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setError('ダウンロードに失敗しました')
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false
    if (startDate && payment.date < startDate) return false
    if (endDate && payment.date > endDate) return false
    return true
  })

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">決済一覧</h1>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaDownload className="mr-2" />
            明細ダウンロード
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                決済状況
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="完了">完了</option>
                <option value="保留中">保留中</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                開始日
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                終了日
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払方法
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === '完了' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowDetailModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細を見る
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="前のページ"
              className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            >
              前へ
            </button>
            <span className="text-sm text-gray-700">
              ページ {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="次のページ"
              className="px-4 py-2 border rounded text-sm"
            >
              次へ
            </button>
          </div>
        </div>

        {showDetailModal && selectedPayment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full">
              <h2 className="text-xl font-bold mb-4">決済詳細</h2>
              <div className="space-y-4">
                <p>決済ID: {selectedPayment.id}</p>
                <p>金額: ¥{selectedPayment.amount.toLocaleString()}</p>
                <p>支払方法: {selectedPayment.paymentMethod}</p>
                <p>状態: {selectedPayment.status}</p>
                <p>日付: {selectedPayment.date}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}