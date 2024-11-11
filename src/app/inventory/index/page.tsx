"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { FaSearch, FaSort, FaBell, FaHistory, FaEdit } from 'react-icons/fa';
import { supabase } from '@/supabase';

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');

  useEffect(() => {
    fetchInventoryData();
    fetchHistoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) throw error;
      setInventory(data);
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_history');
      if (error) throw error;
      setHistory(data);
    } catch (err) {
      setError('履歴の取得に失敗しました');
    }
  };

  const handleUpdateStock = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: parseInt(newStock) })
        .eq('id', selectedItem.id);
      if (error) throw error;
      fetchInventoryData();
      setShowUpdateModal(false);
    } catch (err) {
      setError('在庫の更新に失敗しました');
    }
  };

  const handleAlertSettings = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ alert_threshold: parseInt(alertThreshold) })
        .eq('id', selectedItem.id);
      if (error) throw error;
      fetchInventoryData();
      setShowAlertModal(false);
    } catch (err) {
      setError('アラート設定の更新に失敗しました');
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    return sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
  });

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center">読み込み中...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">在庫管理</h1>
              <div className="flex space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="商品名で検索"
                    className="pl-10 pr-4 py-2 border rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center px-4 py-2 bg-white border rounded-lg"
                  aria-label="在庫数でソート"
                >
                  <FaSort className="mr-2" />
                  在庫数でソート
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">商品名</th>
                    <th className="px-6 py-3 text-left">現在の在庫数</th>
                    <th className="px-6 py-3 text-left">アラートしきい値</th>
                    <th className="px-6 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventory.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4" data-testid="stock-value">{item.stock}</td>
                      <td className="px-6 py-4">{item.alert_threshold}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowUpdateModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800"
                            aria-label="在庫数更新"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAlertModal(true);
                            }}
                            className="p-2 text-yellow-600 hover:text-yellow-800"
                            aria-label="アラート設定"
                          >
                            <FaBell />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showUpdateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">在庫数更新</h2>
                  <input
                    type="number"
                    aria-label="在庫数"
                    className="border rounded px-3 py-2 mb-4"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="px-4 py-2 text-gray-600"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleUpdateStock}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      更新
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAlertModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">アラート設定</h2>
                  <input
                    type="number"
                    aria-label="アラートしきい値"
                    className="border rounded px-3 py-2 mb-4"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAlertModal(false)}
                      className="px-4 py-2 text-gray-600"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleAlertSettings}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}