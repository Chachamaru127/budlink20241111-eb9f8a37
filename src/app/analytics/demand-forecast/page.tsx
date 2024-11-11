"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { FiDownload, FiSettings, FiRefreshCw } from 'react-icons/fi'
import { BiAnalyse } from 'react-icons/bi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function DemandForecast() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('')
  const [model, setModel] = useState('')
  const [forecastData, setForecastData] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '需要予測チャート',
      },
    },
  }

  const handleExecuteForecast = async () => {
    setError('')
    setValidationErrors({})

    const errors = {}
    if (!period) errors['period'] = '分析期間を選択してください'
    if (!model) errors['model'] = '予測モデルを選択してください'

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/forecasts/predict', {
        period,
        model,
      })
      setForecastData(response.data)
    } catch (err) {
      setError('予測の実行に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!forecastData) return

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      forecastData.dates.map((date, index) => 
        `${date},${forecastData.values[index]},${forecastData.predictions[index]}`
      ).join('
')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', '需要予測結果.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BiAnalyse className="mr-2" />
              需要予測
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700">
                  分析期間
                </label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  <option value="3">3ヶ月</option>
                  <option value="6">6ヶ月</option>
                  <option value="12">12ヶ月</option>
                </select>
                {validationErrors.period && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.period}</p>
                )}
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  予測モデル
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  <option value="arima">ARIMA</option>
                  <option value="prophet">Prophet</option>
                  <option value="lstm">LSTM</option>
                </select>
                {validationErrors.model && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.model}</p>
                )}
              </div>

              <button
                onClick={handleExecuteForecast}
                disabled={loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? (
                  <div data-testid="loading-spinner" className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiRefreshCw className="mr-2" />
                    予測実行
                  </>
                )}
              </button>

              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
            </div>

            {forecastData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div data-testid="forecast-chart">
                  <Line
                    options={chartOptions}
                    data={{
                      labels: forecastData.dates,
                      datasets: [
                        {
                          label: '実績値',
                          data: forecastData.values,
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1,
                        },
                        {
                          label: '予測値',
                          data: forecastData.predictions,
                          borderColor: 'rgb(255, 99, 132)',
                          tension: 0.1,
                        },
                      ],
                    }}
                  />
                </div>
                
                <button
                  onClick={handleExportCSV}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiDownload className="mr-2" />
                  CSVエクスポート
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}