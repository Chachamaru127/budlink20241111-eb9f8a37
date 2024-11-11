import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

type AccessLog = {
  userId: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  attempts?: number;
  timestamp?: string;
};

type SecurityAlert = {
  id: number;
  userId: string;
  type: string;
  riskScore: number;
  timestamp: string;
  details: Record<string, any>;
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type === 'alerts') {
      const { data: alerts, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return NextResponse.json({ alerts }, { status: 200 });
    } else {
      const { data: logs, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return NextResponse.json({ logs }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessLog: AccessLog = await req.json();

    if (!accessLog.userId || !accessLog.ipAddress || !accessLog.endpoint) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      ...accessLog,
      timestamp,
      attempts: accessLog.attempts || 1
    };

    // アクセスパターンの分析
    const { data: recentLogs } = await supabase
      .from('access_logs')
      .select('*')
      .eq('userId', accessLog.userId)
      .gt('timestamp', new Date(Date.now() - 3600000).toISOString())
      .order('timestamp', { ascending: false });

    // リスクスコアの計算
    const riskScore = calculateRiskScore(accessLog, recentLogs || []);

    // アクセスログの記録
    const { data: insertedLog, error: logError } = await supabase
      .from('access_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) throw logError;

    // 不正アクセス判定とアラート生成
    if (riskScore > 0.7) {
      const alert = {
        userId: accessLog.userId,
        type: 'suspicious_access',
        riskScore,
        timestamp,
        details: {
          ipAddress: accessLog.ipAddress,
          attempts: accessLog.attempts,
          recentAccessCount: recentLogs?.length || 0
        }
      };

      const { data: insertedAlert, error: alertError } = await supabase
        .from('security_alerts')
        .insert(alert)
        .select()
        .single();

      if (alertError) throw alertError;

      return NextResponse.json({
        id: insertedLog.id,
        riskScore,
        alert: insertedAlert
      }, { status: 201 });
    }

    return NextResponse.json({
      id: insertedLog.id,
      riskScore
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function calculateRiskScore(currentAccess: AccessLog, recentLogs: AccessLog[]): number {
  let score = 0;

  // 不審なIPアドレス
  if (currentAccess.ipAddress === 'unknown' || !currentAccess.ipAddress.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    score += 0.3;
  }

  // 不審なユーザーエージェント
  if (currentAccess.userAgent === 'Unknown' || currentAccess.userAgent.length < 10) {
    score += 0.2;
  }

  // 管理者向けエンドポイントへのアクセス
  if (currentAccess.endpoint.includes('/api/admin')) {
    score += 0.2;
  }

  // 短時間での多数のアクセス試行
  const accessCount = recentLogs.length;
  if (accessCount > 10) {
    score += 0.3;
  } else if (accessCount > 5) {
    score += 0.1;
  }

  // 連続した失敗試行
  if (currentAccess.attempts && currentAccess.attempts > 5) {
    score += Math.min((currentAccess.attempts - 5) * 0.1, 0.3);
  }

  return Math.min(score, 1);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
}