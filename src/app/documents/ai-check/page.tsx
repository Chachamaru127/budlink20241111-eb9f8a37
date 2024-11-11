"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { FiUpload, FiCheck, FiX, FiRefreshCw, FiEye } from 'react-icons/fi'
import { supabase } from '@/supabase'
import axios from 'axios'

export default function AICheck() {
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [aiResults, setAiResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHighlight, setShowHighlight] = useState(true)
  const [uploadComplete, setUploadComplete] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const mockDocumentData = {
        id: 'doc-1',
        content: 'テスト文書内容',
        status: 'pending'
      }
      const mockAIResults = {
        documentId: 'doc-1',
        analysis: {
          issues: [
            {
              type: 'warning',
              message: '要確認項目があります',
              location: { start: 0, end: 10 }
            }
          ],
          score: 85,
          suggestions: ['修正提案1', '修正提案2']
        }
      }
      setDocument(mockDocumentData)
      setAiResults(mockAIResults)
    } catch (err) {
      setError('エラーが発生しました')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadComplete(true)
    }
  }

  const handleApprove = async () => {
    try {
      await axios.post('/api/document-verification', {
        documentId: document.id,
        status: 'approved'
      })
    } catch (err) {
      setError('承認処理に失敗しました')
    }
  }

  const handleReanalyze = async () => {
    try {
      await axios.post('/api/document-verification', {
        action: 'reanalyze',
        documentId: document.id
      })
    } catch (err) {
      setError('再分析に失敗しました')
    }
  }

  const applySuggestion = () => {
    setDocument(prev => ({
      ...prev,
      content: '修正が適用されました'
    }))
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">AI書類チェック</h1>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div data-testid="document-viewer" data-highlight={showHighlight}>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-semibold">書類プレビュー</h2>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showHighlight}
                      onChange={e => setShowHighlight(e.target.checked)}
                      role="switch"
                      aria-label="ハイライト表示"
                      className="mr-2"
                    />
                    <span>ハイライト表示</span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <input
                    type="file"
                    data-testid="file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer"
                  >
                    <FiUpload className="mr-2" />
                    ファイルをアップロード
                  </label>
                </div>

                {uploadComplete && (
                  <div className="text-green-600">アップロード完了</div>
                )}

                <div className="border rounded p-4">
                  {document?.content}
                </div>
              </div>
            </div>

            <div data-testid="ai-analyzer">
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">AI分析結果</h2>
                
                {aiResults && (
                  <>
                    <div className="mb-4">
                      <div className="font-semibold">スコア: {aiResults.analysis.score}</div>
                      {aiResults.analysis.issues.map((issue: any, index: number) => (
                        <div key={index} className="mt-2 p-2 bg-yellow-50 rounded">
                          {issue.message}
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">修正提案</h3>
                      {aiResults.analysis.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                          <span>{suggestion}</span>
                          <button
                            onClick={applySuggestion}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            修正を適用
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleApprove}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FiCheck className="mr-2" />
                        承認
                      </button>
                      
                      <button
                        onClick={handleReanalyze}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <FiRefreshCw className="mr-2" />
                        再分析
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}