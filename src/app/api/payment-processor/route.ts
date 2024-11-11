import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 決済情報の検証
    if (!validatePaymentData(body)) {
      return NextResponse.json({ error: '不正な決済情報です' }, { status: 400 });
    }

    // 決済確認処理
    if (body.action === 'confirm' && body.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.confirm(body.paymentIntentId);
      return NextResponse.json(paymentIntent);
    }

    // 新規決済処理
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount,
      currency: body.currency || 'jpy',
      payment_method: body.paymentMethod,
      customer: body.customerId,
      description: body.description,
      confirm: true,
    });

    // 取引記録の保存
    const { error: dbError } = await supabase.from('transactions').insert({
      payment_intent_id: paymentIntent.id,
      amount: body.amount,
      status: paymentIntent.status,
      customer_id: body.customerId,
      payment_method: body.paymentMethod,
      description: body.description,
    });

    if (dbError) {
      throw new Error('取引記録の保存に失敗しました');
    }

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('決済処理エラー:', error);
    return NextResponse.json(
      { error: '決済処理に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: '決済IDが必要です' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return NextResponse.json(paymentIntent);

  } catch (error) {
    console.error('決済状態取得エラー:', error);
    return NextResponse.json(
      { error: '決済状態の取得に失敗しました' },
      { status: 500 }
    );
  }
}

function validatePaymentData(data: any): boolean {
  if (!data) return false;
  if (data.action === 'confirm' && data.paymentIntentId) return true;
  
  if (
    typeof data.amount !== 'number' ||
    data.amount <= 0 ||
    !data.paymentMethod ||
    !data.customerId
  ) {
    return false;
  }
  
  return true;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}