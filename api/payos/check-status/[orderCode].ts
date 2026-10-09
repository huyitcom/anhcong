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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let orderCodeStr = req.query?.orderCode || req.params?.orderCode;
    if (!orderCodeStr && req.url) {
      const match = req.url.match(/check-status\/([0-9]+)/);
      if (match) orderCodeStr = match[1];
    }

    const orderCode = Number(orderCodeStr);
    if (!orderCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng orderCode hợp lệ.' });
    }

    const payos = getPayosInstance();
    let paymentInfo: any;

    if (payos.paymentRequests && typeof payos.paymentRequests.get === 'function') {
      paymentInfo = await payos.paymentRequests.get(orderCode);
    } else if (typeof (payos as any).getPaymentLinkInformation === 'function') {
      paymentInfo = await (payos as any).getPaymentLinkInformation(orderCode);
    } else {
      throw new Error('PayOS SDK get info method not available');
    }

    const isPaid = paymentInfo?.status === 'PAID';
    console.log(`[PayOS Status] Order ${orderCode}: status=${paymentInfo?.status}, isPaid=${isPaid}`);

    return res.status(200).json({
      success: true,
      orderCode,
      status: paymentInfo.status,
      isPaid,
      amount: paymentInfo.amount,
      amountPaid: paymentInfo.amountPaid,
      rawStatus: paymentInfo.status,
    });
  } catch (err: any) {
    console.error('[PayOS Check Status Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Không thể kiểm tra trạng thái đơn hàng PayOS.',
    });
  }
}
