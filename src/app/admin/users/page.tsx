"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FiSearch, FiAlertTriangle, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { BiUserCheck, BiUserX } from 'react-icons/bi'
import { IoMdRefresh } from 'react-icons/io'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    fetchUsers()
    fetchSecurityAlerts()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data)
      setLoading(false)
    } catch (error) {
      setError('データの取得に失敗しました')
      setLoading(false)
    }
  }

  const fetchSecurityAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts')
      const data = await response.json()
      setAlerts(data.alerts)
    } catch (error) {
      console.error('Security alerts fetch failed:', error)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      setError('権限の更新に失敗しました')
    }
  }

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      setError('ステータスの更新に失敗しました')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
        </div>

        {alerts.length > 0 && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-400 mr-2" />
              <p className="text-red-700">不正アクセスの可能性があります</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="ユーザーを検索"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <IoMdRefresh className="mr-2" />
            更新
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  権限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    読み込み中...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    ユーザーが見つかりませんでした
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.company_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="admin">管理者</option>
                        <option value="user">一般ユーザー</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        role="switch"
                        className={`relative inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <BiUserCheck className="mr-1" />
                        ) : (
                          <BiUserX className="mr-1" />
                        )}
                        {user.status === 'active' ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <FiEdit2 />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}