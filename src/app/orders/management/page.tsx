"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FiPackage, FiTruck, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { IoFilterOutline } from 'react-icons/io5'

const statusColors = {
  '新規受付': 'bg-blue-100 text-blue-800',
  '出荷準備中': 'bg-yellow-100 text-yellow-800',
  '出荷完了': 'bg-green-100 text-green-800',
  'キャンセル': 'bg-red-100 text-red-800'
}

type Order = {
  id: string
  orderNumber: string
  buyerName: string
  status: string
  totalAmount: number
  orderDate: string
  items: {
    id: number
    name: string
    quantity: number
    price: number
  }[]
}

export default function OrderManagement() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showShipModal, setShowShipModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [message, setMessage] = useState({ type: '', content: '' })

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter))
    }
  }, [statusFilter, orders])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('orderDate', { ascending: false })

      if (error) throw error

      const formattedOrders = data.map(order => ({
        ...order,
        items: JSON.parse(order.items || '[]')
      }))

      setOrders(formattedOrders)
      setFilteredOrders(formattedOrders)
    } catch (error) {
      setMessage({ type: 'error', content: 'エラーが発生しました' })
      // フォールバックデータ
      setOrders(defaultOrders)
      setFilteredOrders(defaultOrders)
    }
  }

  const updateOrderStatus = async () => {
    if (!selectedOrder) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: newStatus }
          : order
      ))
      setMessage({ type: 'success', content: 'ステータスを更新しました' })
      setShowStatusModal(false)
    } catch (error) {
      setMessage({ type: 'error', content: 'エラーが発生しました' })
    }
  }

  const handleShipment = async () => {
    if (!selectedOrder) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: '出荷完了',
          shipping_info: { trackingNumber }
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: '出荷完了' }
          : order
      ))
      setMessage({ type: 'success', content: '出荷処理が完了しました' })
      setShowShipModal(false)
    } catch (error) {
      setMessage({ type: 'error', content: 'エラーが発生しました' })
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">受注管理</h1>
          <div className="mt-4 flex items-center">
            <IoFilterOutline className="mr-2" />
            <label htmlFor="statusFilter" className="mr-2">ステータスフィルター:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-1"
            >
              <option value="all">すべて</option>
              <option value="新規受付">新規受付</option>
              <option value="出荷準備中">出荷準備中</option>
              <option value="出荷完了">出荷完了</option>
              <option value="キャンセル">キャンセル</option>
            </select>
          </div>
        </div>

        {message.content && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.content}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文番号
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    購入者
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文日
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        data-testid={`detail-button-${order.id}`}
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.buyerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        data-testid={`status-update-${order.id}`}
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowStatusModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        <FiPackage className="inline mr-1" />
                        ステータス更新
                      </button>
                      <button
                        data-testid={`ship-button-${order.id}`}
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowShipModal(true)
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FiTruck className="inline mr-1" />
                        出荷処理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ステータス更新モーダル */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">ステータス更新</h3>
            <select
              data-testid="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4"
            >
              <option value="">選択してください</option>
              <option value="新規受付">新規受付</option>
              <option value="出荷準備中">出荷準備中</option>
              <option value="出荷完了">出荷完了</option>
              <option value="キャンセル">キャンセル</option>
            </select>
            <div className="flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={updateOrderStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 出荷処理モーダル */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">出荷処理</h3>
            <label className="block mb-2">追跡番号</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowShipModal(false)}
                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleShipment}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                出荷確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const defaultOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    buyerName: 'テスト購入者1',
    status: '新規受付',
    totalAmount: 50000,
    orderDate: '2024-01-01',
    items: [
      { id: 1, name: '商品A', quantity: 2, price: 25000 }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    buyerName: 'テスト購入者2',
    status: '出荷準備中',
    totalAmount: 30000,
    orderDate: '2024-01-02',
    items: [
      { id: 2, name: '商品B', quantity: 1, price: 30000 }
    ]
  }
]