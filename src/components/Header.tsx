"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiBox, FiBarChart2, FiUsers, FiFileText, FiDollarSign, FiDatabase } from 'react-icons/fi'

type UserObject = {
  id: string
  email: string
  companyName: string
  role: string
  notifications?: number
}

type HeaderProps = {
  user: UserObject | null
  onLogout: () => void
}

const Header = ({ user, onLogout }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { name: 'ダッシュボード', icon: <FiBarChart2 />, path: '/dashboard' },
    { name: '商品管理', icon: <FiBox />, path: '/products' },
    { name: 'トレーサビリティ', icon: <FiDatabase />, path: '/traceability' },
    { name: '取引管理', icon: <FiDollarSign />, path: '/orders' },
    { name: '書類管理', icon: <FiFileText />, path: '/documents' },
  ]

  const adminMenuItems = [
    { name: 'システム管理', icon: <FiSettings />, path: '/admin' },
    { name: 'ユーザー管理', icon: <FiUsers />, path: '/admin/users' },
  ]

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <Image
                src="https://placehold.co/200x50"
                alt="BudLink Logo"
                width={200}
                height={50}
                className="h-8 w-auto"
              />
            </div>

            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              {user?.role === 'ADMIN' && adminMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {user && (
            <div className="flex items-center">
              <button
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 relative"
                aria-label="通知"
              >
                <FiBell className="h-6 w-6" />
                {user.notifications && user.notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs text-center leading-5">
                    {user.notifications}
                  </span>
                )}
              </button>

              <div className="ml-3 relative">
                <button
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="ユーザーメニュー"
                >
                  <span className="mr-2 text-gray-700">{user.companyName}</span>
                  <FiUser className="h-6 w-6 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 text-sm text-gray-700">
                      {user.email}
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      プロフィール
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      設定
                    </Link>
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-label="メニュー"
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              >
                <span className="inline-flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </span>
              </Link>
            ))}
            {user?.role === 'ADMIN' && adminMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              >
                <span className="inline-flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header