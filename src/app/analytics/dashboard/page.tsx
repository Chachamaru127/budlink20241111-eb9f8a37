"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FiDownload, FiCalendar, FiBarChart2, FiPieChart } from 'react-icons/fi'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('30days')
  const [chartType, setChartType] = useState('line')
  const [analyticsData, setAnalyticsData] = useState({
    transactions: [],
    salesData: {
      totalSales: 0,
      averageOrderValue: 0,
      topProducts: []
    }
  })

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/analytics?period=${period}`)
      setAnalyticsData(response.data)
      setError('')
    } catch (err) {
      setError('データの取得に失敗しました')
      // フォールバックデータ
      setAnalyticsData({
        transactions: [
          { id: 1, date: '2024-01-01', amount: 10000, product: 'CBD Oil' },
          { id: 2, date: '2024-01-02', amount: 15000, product: 'CBD Cream' }
        ],
        salesData: {
          totalSales: 25000,
          averageOrderValue: 12500,
          topProducts: ['CBD Oil', 'CBD Cream']
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const handleExport = async () => {
    try {
      const response = await axios.post('/api/analytics/export', {
        period,
        data: analyticsData
      })
      window.open(response.data.downloadUrl, '_blank')
    } catch (err) {
      setError('レポートの出力に失敗しました')
    }
  }

  const chartData = {
    labels: analyticsData.transactions.map(t => t.date),
    datasets: [{
      label: '売上',
      data: analyticsData.transactions.map(t => t.amount),
      borderColor: '#2C5282',
      backgroundColor: 'rgba(44, 82, 130, 0.2)',
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '売上推移',
      },
    },
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">総売上</h3>
            <p className="text-2xl">¥{analyticsData.salesData.totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">平均注文額</h3>
            <p className="text-2xl">¥{analyticsData.salesData.averageOrderValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">人気商品</h3>
            <ul>
              {analyticsData.salesData.topProducts.map((product, index) => (
                <li key={index}>{product}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded px-3 py-2"
                aria-label="期間"
              >
                <option value="7days">7日間</option>
                <option value="30days">30日間</option>
                <option value="90days">90日間</option>
              </select>
              <div className="space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-100' : ''}`}
                  aria-label="棒グラフ"
                >
                  <FiBarChart2 />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-100' : ''}`}
                >
                  <FiBarChart2 className="rotate-90" />
                </button>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <FiDownload />
              <span>レポートをエクスポート</span>
            </button>
          </div>

          <div className="h-96">
            {chartType === 'line' ? (
              <Line options={chartOptions} data={chartData} />
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}