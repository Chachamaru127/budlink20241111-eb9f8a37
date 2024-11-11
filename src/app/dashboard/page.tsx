"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BiPackage, BiMoney, BiBell, BiRefresh } from 'react-icons/bi'
import { MdOutlineInventory2 } from 'react-icons/md'
import { FaRegCalendarAlt } from 'react-icons/fa'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [productSummary, setProductSummary] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedTab, setSelectedTab] = useState('overview')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証エラー')

      const [userResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      setUserData(userResult.data)
      
      const products = productsResult.data || []
      setProductSummary({
        total: products.length,
        inStock: products.filter(p => p.stock > 10).length,
        lowStock: products.filter(p => p.stock <= 10).length
      })

      setRecentOrders(ordersResult.data || [])
      setNotifications([
        {
          id: 1,
          title: '在庫アラート',
          message: '商品Aの在庫が残り少なくなっています',
          type: 'warning',
          createdAt: '2024-01-01T10:00:00'
        }
      ])
    } catch (err) {
      setError('エラーが発生しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  if (loading) return (
    <div className="min-h-screen h-full flex items-center justify-center">
      <div data-testid="loading-spinner" className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen h-full flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            <BiRefresh className="mr-2" />
            更新
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <BiPackage className="text-3xl text-blue-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">総在庫数</p>
                <p className="text-2xl font-bold">{productSummary.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <MdOutlineInventory2 className="text-3xl text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">在庫あり</p>
                <p className="text-2xl font-bold">{productSummary.inStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <BiBell className="text-3xl text-orange-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">在庫少</p>
                <p className="text-2xl font-bold">{productSummary.lowStock}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">最近の注文</h2>
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <FaRegCalendarAlt className="text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{new Date(order.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{order.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">¥{order.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">通知</h2>
              <div className="space-y-4">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-4 border rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{notif.title}</h3>
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        既読にする
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}