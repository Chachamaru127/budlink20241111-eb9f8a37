import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

const SUPPORTED_MODELS = ['arima', 'prophet', 'lstm'];
const MAX_PERIOD = 12;
const MIN_PERIOD = 1;

type PredictionResult = {
  dates: string[];
  values: number[];
  predictions: number[];
  confidence_intervals?: {
    upper: number[];
    lower: number[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, period, model, confidenceLevel = 0.95 } = body;

    if (!productId || !period || !model) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    if (period < MIN_PERIOD || period > MAX_PERIOD) {
      return NextResponse.json(
        { error: '分析期間は1〜12ヶ月の間で指定してください' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: 'サポートされていない予測モデルです' },
        { status: 400 }
      );
    }

    if (confidenceLevel <= 0 || confidenceLevel > 1) {
      return NextResponse.json(
        { error: '信頼区間は0〜1の間で指定してください' },
        { status: 400 }
      );
    }

    const { data: predictionData, error } = await supabase.rpc('generate_demand_forecast', {
      p_product_id: productId,
      p_period: period,
      p_model: model,
      p_confidence_level: confidenceLevel
    });

    if (error) {
      console.error('予測処理エラー:', error);
      return NextResponse.json(
        { error: '予測処理中にエラーが発生しました' },
        { status: 500 }
      );
    }

    if (!predictionData) {
      return NextResponse.json(
        { error: '予測に必要なデータが不足しています' },
        { status: 404 }
      );
    }

    try {
      const prompt = `
        以下の売上データから、今後${period}ヶ月の需要予測を行ってください:
        製品ID: ${productId}
        モデル: ${model}
        予測期間: ${period}ヶ月
        信頼区間: ${confidenceLevel}
      `;

      const aiResponse = await getLlmModelAndGenerateContent(
        'Gemini',
        '需要予測AI分析システム',
        prompt
      );

      const result: PredictionResult = predictionData;

      return NextResponse.json(result);
    } catch (aiError) {
      console.error('AI分析エラー:', aiError);
      return NextResponse.json(predictionData);
    }
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予測処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: '許可されていないメソッドです' },
    { status: 405 }
  );
}