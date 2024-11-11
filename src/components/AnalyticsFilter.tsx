"use client"

import { useState, useEffect } from 'react';
import { BiCalendar, BiReset, BiCheck } from 'react-icons/bi';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface AnalyticsFilterProps {
  dateRange: DateRange;
  metrics: string[];
  onApply: (filters: { dateRange: DateRange; metrics: string[] }) => void;
}

const AnalyticsFilter = ({ dateRange, metrics, onApply }: AnalyticsFilterProps) => {
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>(dateRange);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metrics);
  const [error, setError] = useState<string>('');

  const validateFilters = (): boolean => {
    if (new Date(currentDateRange.endDate) < new Date(currentDateRange.startDate)) {
      setError('終了日は開始日より後の日付を選択してください');
      return false;
    }
    
    if (selectedMetrics.length === 0) {
      setError('1つ以上のメトリクスを選択してください');
      return false;
    }

    setError('');
    return true;
  };

  const handleApply = () => {
    if (validateFilters()) {
      onApply({
        dateRange: currentDateRange,
        metrics: selectedMetrics
      });
    }
  };

  const handleReset = () => {
    setCurrentDateRange(dateRange);
    setSelectedMetrics(metrics);
    setError('');
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">分析フィルター</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">期間</label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <BiCalendar className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                aria-label="開始日"
                value={currentDateRange.startDate}
                onChange={(e) => setCurrentDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-gray-500">〜</span>
            <div className="relative">
              <BiCalendar className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                aria-label="終了日"
                value={currentDateRange.endDate}
                onChange={(e) => setCurrentDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">メトリクス</label>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <label key={metric} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={() => toggleMetric(metric)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{metric}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleApply}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <BiCheck className="mr-2" />
            適用
          </button>
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <BiReset className="mr-2" />
            リセット
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsFilter;