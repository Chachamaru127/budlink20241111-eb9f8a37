import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

type LocationData = {
  latitude?: number;
  longitude?: number;
  address: string;
};

type TraceUpdateRequest = {
  productId: string;
  location: string | LocationData;
  status: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
};

type TraceHistoryRecord = {
  id: string;
  productId: string;
  location: string | LocationData;
  status: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  updatedAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as TraceUpdateRequest;

    // 必須パラメータの検証
    if (!data.location || !data.productId || !data.status || !data.timestamp) {
      return NextResponse.json(
        { error: 'location は必須パラメータです' },
        { status: 400 }
      );
    }

    // タイムスタンプの検証
    const timestamp = new Date(data.timestamp);
    const now = new Date();
    if (timestamp > now) {
      return NextResponse.json(
        { error: '不正なタイムスタンプです' },
        { status: 400 }
      );
    }

    // 環境データの検証
    if (data.temperature !== undefined && (data.temperature < -50 || data.temperature > 50)) {
      return NextResponse.json(
        { error: '環境データが許容範囲外です' },
        { status: 400 }
      );
    }
    if (data.humidity !== undefined && (data.humidity < 0 || data.humidity > 100)) {
      return NextResponse.json(
        { error: '環境データが許容範囲外です' },
        { status: 400 }
      );
    }

    // 製品の存在確認
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', data.productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: '指定された製品が見つかりません' },
        { status: 404 }
      );
    }

    // トレーサビリティ情報の更新
    const { data: updateResult, error: updateError } = await supabase
      .from('traceability')
      .update({
        status: data.status,
        location: data.location,
        temperature: data.temperature,
        humidity: data.humidity,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', data.productId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'データベース更新中にエラーが発生しました' },
        { status: 500 }
      );
    }

    // 履歴の記録
    const { error: historyError } = await supabase
      .from('trace_history')
      .insert({
        product_id: data.productId,
        location: data.location,
        status: data.status,
        timestamp: data.timestamp,
        temperature: data.temperature,
        humidity: data.humidity
      });

    if (historyError) {
      console.error('History error:', historyError);
      return NextResponse.json(
        { error: '履歴の記録中にエラーが発生しました' },
        { status: 500 }
      );
    }

    // AIによる異常検知
    try {
      const aiPrompt = `
        製品ID: ${data.productId}
        位置情報: ${JSON.stringify(data.location)}
        状態: ${data.status}
        温度: ${data.temperature}
        湿度: ${data.humidity}
        
        上記のデータから異常や不正な流通パターンを検出してください。
      `;

      const aiResponse = await getLlmModelAndGenerateContent(
        'Gemini',
        '製品の流通における異常検知を行うAIアシスタント',
        aiPrompt
      );

      if (aiResponse && aiResponse.includes('異常')) {
        await supabase
          .from('alerts')
          .insert({
            product_id: data.productId,
            type: 'anomaly_detection',
            description: aiResponse,
            created_at: new Date().toISOString()
          });
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
    }

    return NextResponse.json({
      success: true,
      data: updateResult
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}