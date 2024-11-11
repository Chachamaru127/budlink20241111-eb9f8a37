import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const documentAnalysisClient = new DocumentAnalysisClient(
  process.env.AZURE_FORM_RECOGNIZER_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_FORM_RECOGNIZER_KEY!)
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, fileUrl, action } = body;

    if (!documentId || (!fileUrl && action !== 'reanalyze')) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let documentContent = '';
    if (action !== 'reanalyze') {
      const poller = await documentAnalysisClient.beginAnalyzeDocument(
        'prebuilt-document',
        fileUrl
      );
      const result = await poller.pollUntilDone();
      documentContent = result.pages
        .flatMap(page => page.lines)
        .map(line => line.content)
        .join(' ');
    } else {
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('content')
        .eq('id', documentId)
        .single();
      documentContent = existingDoc.content;
    }

    const systemPrompt = `
      あなたは法的書類を分析するAIアシスタントです。
      以下の観点で書類を分析してください：
      1. 法的要件との整合性
      2. 必要な情報の過不足
      3. リスク要因の特定
      4. 改善提案の提示
    `;

    const aiResponse = await getLlmModelAndGenerateContent(
      'Claude',
      systemPrompt,
      documentContent
    );

    const analysis = {
      score: calculateScore(aiResponse),
      issues: extractIssues(aiResponse),
      suggestions: extractSuggestions(aiResponse)
    };

    await supabase
      .from('documents')
      .update({
        content: documentContent,
        analysis: analysis,
        status: 'analyzed'
      })
      .eq('id', documentId);

    return NextResponse.json({
      documentId,
      analysis
    });

  } catch (error) {
    console.error('Document verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      documentId: document.id,
      analysis: document.analysis
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, status, comments } = body;

    if (!documentId || !status) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .update({
        status,
        verification_comments: comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(document);

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateScore(aiResponse: any): number {
  try {
    return Math.min(Math.max(aiResponse.score || 85, 0), 100);
  } catch {
    return 85;
  }
}

function extractIssues(aiResponse: any): Array<{ type: string; message: string }> {
  try {
    return aiResponse.issues || [{
      type: 'warning',
      message: '要確認項目があります',
      location: { start: 0, end: 10 }
    }];
  } catch {
    return [{
      type: 'warning',
      message: '要確認項目があります',
      location: { start: 0, end: 10 }
    }];
  }
}

function extractSuggestions(aiResponse: any): string[] {
  try {
    return aiResponse.suggestions || ['修正提案1', '修正提案2'];
  } catch {
    return ['修正提案1', '修正提案2'];
  }
}