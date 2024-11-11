"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { IoHomeOutline, IoLayersOutline, IoDocumentTextOutline, IoCartOutline, IoAnalyticsOutline, IoSettingsOutline, IoReceiptOutline, IoBarChartOutline, IoPeopleOutline, IoQrCodeOutline, IoArchiveOutline, IoDocumentsOutline, IoServerOutline } from 'react-icons/io5'
import { BiChevronLeft } from 'react-icons/bi'

type MenuItemType = {
  id: string
  label: string
  icon: JSX.Element
  path: string
}

type SidebarProps = {
  menuItems?: MenuItemType[]
  activeItem: string
}

const defaultMenuItems: MenuItemType[] = [
  { id: 'dashboard', label: 'ダッシュボード', icon: <IoHomeOutline size={24} />, path: '/dashboard' },
  { id: 'traceability', label: 'トレーサビリティ管理', icon: <IoLayersOutline size={24} />, path: '/traceability' },
  { id: 'traceability-register', label: 'トレーサビリティ登録', icon: <IoDocumentTextOutline size={24} />, path: '/traceability/register' },
  { id: 'products', label: '商品一覧', icon: <IoCartOutline size={24} />, path: '/products' },
  { id: 'product-register', label: '商品登録', icon: <IoDocumentTextOutline size={24} />, path: '/products/register' },
  { id: 'orders', label: '受注管理', icon: <IoReceiptOutline size={24} />, path: '/orders' },
  { id: 'documents', label: '書類管理', icon: <IoDocumentsOutline size={24} />, path: '/documents' },
  { id: 'payments', label: '決済管理', icon: <IoBarChartOutline size={24} />, path: '/payments' },
  { id: 'analytics', label: 'データ分析', icon: <IoAnalyticsOutline size={24} />, path: '/analytics' },
  { id: 'users', label: 'ユーザー管理', icon: <IoPeopleOutline size={24} />, path: '/admin/users' },
  { id: 'qr-generator', label: 'QRコード生成', icon: <IoQrCodeOutline size={24} />, path: '/traceability/qr-generator' },
  { id: 'inventory', label: '在庫管理', icon: <IoArchiveOutline size={24} />, path: '/inventory' },
  { id: 'ai-check', label: 'AI書類チェック', icon: <IoServerOutline size={24} />, path: '/documents/ai-check' },
  { id: 'demand-forecast', label: '需要予測', icon: <IoAnalyticsOutline size={24} />, path: '/analytics/demand-forecast' }
]

export default function Sidebar({ menuItems = defaultMenuItems, activeItem }: SidebarProps) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavigate = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
        onClick={toggleMobileMenu}
        aria-label="mobile menu"
      >
        <IoHomeOutline size={24} />
      </button>

      <nav
        className={`
          fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        data-testid="menu-icon"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className={`font-bold text-lg text-gray-800 ${isCollapsed ? 'hidden' : 'block'}`}>
            BudLink
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="toggle sidebar"
          >
            <BiChevronLeft
              size={24}
              className={`transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <ul className="p-2">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`
                mb-2 rounded-lg cursor-pointer transition-all
                ${activeItem === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}
              `}
              onClick={() => handleNavigate(item.path)}
            >
              <div className="flex items-center p-3">
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}