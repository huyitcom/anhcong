import dotenv from 'dotenv';
dotenv.config();

import { PayOS } from '@payos/node';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '5f6bbed7-e4c7-4fde-82e5-1290a6b55167';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '64d99978-d52c-4f37-88bd-b2a3d4da42a8';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '9b00ffc968a8ea8599a3f2ec7c935675cc7dd043ad9df2020491478e124b50b6';

function getPayosInstance() {
  return new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const webhookBody = req.body;
    console.log('[PayOS Webhook Received]', JSON.stringify(webhookBody));

    const payos = getPayosInstance();
    let webhookData: any;

    if (payos.webhooks && typeof payos.webhooks.verify === 'function') {
      webhookData = payos.webhooks.verify(webhookBody);
    } else if (typeof (payos as any).verifyPaymentWebhookData === 'function') {
      webhookData = (payos as any).verifyPaymentWebhookData(webhookBody);
    } else {
      webhookData = webhookBody?.data || webhookBody;
    }

    const data = webhookData || webhookBody?.data || webhookBody;
    const orderCode = Number(data?.orderCode);
    console.log(`[PayOS Webhook] Processed successfully for order ${orderCode}`);

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('[PayOS Webhook Error]', err);
    return res.status(200).json({ success: false, error: err?.message });
  }
}
