"use client"

import { useEffect, useRef } from 'react';
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
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

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
);

interface ChartProps {
  data: ChartData<'line' | 'bar' | 'pie'>;
  type: 'line' | 'bar' | 'pie';
  options: ChartOptions;
}

export default function Charts({ data, type, options }: ChartProps) {
  const chartRef = useRef<ChartJS>();

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data.labels?.length || !data.datasets?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  const chartProps = {
    data,
    options: {
      ...options,
      responsive: true,
      maintainAspectRatio: true,
      onResize: (chart) => {
        if (chartRef.current) {
          chartRef.current = chart;
        }
      }
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line {...chartProps} role="img" aria-label={options.plugins?.title?.text as string} />;
      case 'bar':
        return <Bar {...chartProps} role="img" aria-label={options.plugins?.title?.text as string} />;
      case 'pie':
        return <Pie {...chartProps} role="img" aria-label={options.plugins?.title?.text as string} />;
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <p className="text-gray-500">不正なチャートタイプです</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] p-4 bg-white rounded-lg shadow-sm">
      <div className="relative h-full">
        {renderChart()}
      </div>
    </div>
  );
}