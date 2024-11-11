import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

type TraceabilityInfo = {
  productName: string;
  manufacturer: string;
  lotNumber: string;
  [key: string]: any;
};

type QRCodeRequest = {
  productId: string;
  traceInfo: TraceabilityInfo;
  batchMode?: boolean;
  products?: Array<{
    productId: string;
    traceInfo: TraceabilityInfo;
  }>;
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'リクエストボディが不正です'
      });
    }

    const requestData: QRCodeRequest = req.body;

    if (requestData.batchMode && requestData.products) {
      return await handleBatchQRGeneration(requestData.products, res);
    } else {
      return await handleSingleQRGeneration(requestData.productId, requestData.traceInfo, res);
    }
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'QRコードの生成に失敗しました'
    });
  }
}

async function handleSingleQRGeneration(
  productId: string,
  traceInfo: TraceabilityInfo,
  res: NextApiResponse
) {
  if (!validateTraceabilityInfo(traceInfo)) {
    return res.status(400).json({
      success: false,
      error: 'トレーサビリティ情報が不正です'
    });
  }

  try {
    const qrData = {
      productId,
      traceInfo,
      timestamp: new Date().toISOString()
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        product_id: productId,
        trace_info: traceInfo,
        qr_data: qrData,
        generated_at: new Date().toISOString()
      })
      .single();

    if (error) {
      throw new Error('DB保存エラー');
    }

    return res.status(200).json({
      success: true,
      qrCode: qrCodeImage,
      url: `https://example.com/qr/${data.id}`
    });
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'QRコードの保存に失敗しました'
    });
  }
}

async function handleBatchQRGeneration(
  products: Array<{ productId: string; traceInfo: TraceabilityInfo }>,
  res: NextApiResponse
) {
  try {
    const qrCodes = await Promise.all(
      products.map(async ({ productId, traceInfo }) => {
        if (!validateTraceabilityInfo(traceInfo)) {
          throw new Error('トレーサビリティ情報が不正です');
        }

        const qrData = {
          productId,
          traceInfo,
          timestamp: new Date().toISOString()
        };

        const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

        const { data, error } = await supabase
          .from('qr_codes')
          .insert({
            product_id: productId,
            trace_info: traceInfo,
            qr_data: qrData,
            generated_at: new Date().toISOString()
          })
          .single();

        if (error) {
          throw new Error('DB保存エラー');
        }

        return {
          qrCode: qrCodeImage,
          url: `https://example.com/qr/${data.id}`
        };
      })
    );

    return res.status(200).json({
      success: true,
      qrCodes
    });
  } catch (error) {
    console.error('バッチQRコード生成エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'QRコードの生成に失敗しました'
    });
  }
}

function validateTraceabilityInfo(traceInfo: TraceabilityInfo): boolean {
  const requiredFields = ['productName', 'manufacturer', 'lotNumber'];
  return requiredFields.every(field => 
    traceInfo[field] && typeof traceInfo[field] === 'string' && traceInfo[field].length > 0
  );
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};