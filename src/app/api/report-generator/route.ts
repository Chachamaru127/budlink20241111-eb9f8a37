import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate, reportType, options = {} } = await req.json();

    if (!startDate || !endDate || !reportType) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: '無効な日付範囲です' }, { status: 400 });
    }

    if (!['sales', 'products', 'customers'].includes(reportType)) {
      return NextResponse.json({ error: '無効なレポートタイプです' }, { status: 400 });
    }

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .between('date', startDate, endDate);

    if (transactionError) {
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    const analyticsData = await generateAnalytics(transactionData);
    const pdfUrl = await generatePDFReport(transactionData, analyticsData, options);

    try {
      const aiSummary = await getLlmModelAndGenerateContent(
        'Gemini',
        'データ分析レポートの要約を生成してください。',
        JSON.stringify(analyticsData)
      );

      return NextResponse.json({
        downloadUrl: pdfUrl,
        summary: aiSummary,
        customOptions: options
      });
    } catch (error) {
      return NextResponse.json({
        downloadUrl: pdfUrl,
        summary: '要約の生成に失敗しました',
        customOptions: options
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'レポートの生成に失敗しました' }, { status: 500 });
  }
}

async function generateAnalytics(transactionData: any[]) {
  const totalSales = transactionData.reduce((sum, transaction) => sum + transaction.amount, 0);
  const averageOrderValue = totalSales / transactionData.length;

  const productSales = transactionData.reduce((acc, transaction) => {
    acc[transaction.product] = (acc[transaction.product] || 0) + transaction.amount;
    return acc;
  }, {});

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([product]) => product);

  return {
    totalSales,
    averageOrderValue,
    topProducts,
    transactionCount: transactionData.length
  };
}

async function generatePDFReport(transactionData: any[], analyticsData: any, options: any) {
  try {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('ja-JP');

    doc.text('販売分析レポート', 20, 20);
    doc.text(`作成日: ${currentDate}`, 20, 30);
    doc.text(`総売上: ¥${analyticsData.totalSales.toLocaleString()}`, 20, 50);
    doc.text(`平均注文額: ¥${analyticsData.averageOrderValue.toLocaleString()}`, 20, 60);
    doc.text('トップ製品:', 20, 70);

    analyticsData.topProducts.forEach((product: string, index: number) => {
      doc.text(`${index + 1}. ${product}`, 30, 80 + (index * 10));
    });

    if (options.includeCharts) {
      const chartData = await generateChartImage(transactionData, options.chartType);
      doc.addImage(chartData, 'PNG', 20, 140, 170, 100);
    }

    const pdfBlob = doc.output('blob');
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('reports')
      .upload(`report-${Date.now()}.pdf`, pdfBlob);

    if (uploadError) {
      throw new Error('ファイルのアップロードに失敗しました');
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('reports')
      .getPublicUrl(uploadData.path);

    return publicUrl;
  } catch (error) {
    throw new Error('PDFレポートの生成に失敗しました');
  }
}

async function generateChartImage(data: any[], chartType: string) {
  try {
    const chartResponse = await axios.post('https://quickchart.io/chart', {
      chart: {
        type: chartType || 'bar',
        data: {
          labels: data.map(item => item.date),
          datasets: [{
            label: '売上',
            data: data.map(item => item.amount)
          }]
        }
      }
    });

    return chartResponse.data;
  } catch (error) {
    return null;
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}