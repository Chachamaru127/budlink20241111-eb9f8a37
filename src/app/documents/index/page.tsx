"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { supabase } from '@/supabase'
import { FiSearch, FiUpload, FiFile, FiAlertCircle, FiCalendar } from 'react-icons/fi'
import { format } from 'date-fns'

interface Document {
  id: string
  name: string
  uploadDate: string
  expiryDate: string
  status: string
  url: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [error, setError] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, sortOrder])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploadDate', { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * 10, currentPage * 10 - 1)

      if (error) throw error
      
      if (data) {
        setDocuments(data as Document[])
      }
    } catch (error) {
      setError('書類の読み込みに失敗しました')
      // フォールバックデータの設定
      setDocuments([
        {
          id: '1',
          name: '許可証A',
          uploadDate: '2024-01-01',
          expiryDate: '2024-12-31',
          status: '有効',
          url: 'https://example.com/doc1.pdf'
        },
        {
          id: '2',
          name: '申請書B',
          uploadDate: '2024-01-15',
          expiryDate: '2024-06-30',
          status: '期限間近',
          url: 'https://example.com/doc2.pdf'
        }
      ])
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    if (!validateFileType(selectedFile)) {
      setError('無効なファイル形式です')
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`${Date.now()}_${selectedFile.name}`, selectedFile)

      if (error) throw error

      setUploadSuccess(true)
      fetchDocuments()
      setSelectedFile(null)
    } catch (error) {
      setError('アップロードに失敗しました')
    }
  }

  const validateFileType = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
    return validTypes.includes(file.type)
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">書類管理</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="書類を検索"
                  className="pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              <div className="flex items-center">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  aria-label="ファイルを選択"
                />
                <label
                  htmlFor="fileUpload"
                  className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center"
                >
                  <FiUpload className="mr-2" />
                  ファイルを選択
                </label>
                {selectedFile && (
                  <button
                    onClick={handleFileUpload}
                    className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    アップロード
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
              アップロード成功
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full" data-testid="documents-table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    書類名
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    アップロード日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    有効期限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} role="row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFile className="mr-2 text-gray-400" />
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(doc.uploadDate), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(doc.expiryDate), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === '有効'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc)
                          setShowViewer(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        閲覧
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
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              前のページ
            </button>
            <span>ページ {currentPage}</span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 border rounded-lg"
              aria-label="次のページ"
            >
              次のページ
            </button>
          </div>
        </div>
      </div>

      {showViewer && selectedDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          data-testid="document-viewer"
        >
          <div className="bg-white p-6 rounded-lg w-3/4 h-3/4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedDocument.name}</h2>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                閉じる
              </button>
            </div>
            <iframe
              src={selectedDocument.url}
              className="w-full h-full"
              title="Document viewer"
            />
          </div>
        </div>
      )}
    </div>
  )
}