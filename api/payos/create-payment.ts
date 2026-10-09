import dotenv from 'dotenv';
dotenv.config();

import { PayOS } from '@payos/node';

// PayOS VietQR Payment Configuration
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
  // Set CORS headers
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
    const {
      amount,
      amountVnd,
      packageName,
      creditsAmount,
      userId,
      userEmail,
      returnUrl,
      cancelUrl,
    } = req.body || {};

    const finalAmount = Math.round(Number(amount || amountVnd));
    const finalCredits = Number(creditsAmount) || 10;

    if (!finalAmount || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin thanh toán (amount/amountVnd, userId).',
      });
    }

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100));
    const description = `PBVN ${finalCredits}luot`.slice(0, 25);

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'photobookvietnam.net';
    const fallbackReturn = `${protocol}://${host}/?payment_status=success&orderCode=${orderCode}`;
    const fallbackCancel = `${protocol}://${host}/?payment_status=cancelled&orderCode=${orderCode}`;

    const paymentData = {
      orderCode,
      amount: finalAmount,
      description,
      returnUrl: returnUrl || fallbackReturn,
      cancelUrl: cancelUrl || fallbackCancel,
    };

    console.log(`[PayOS API] Creating payment request for order ${orderCode}:`, paymentData);

    const payos = getPayosInstance();
    let paymentLinkResponse: any;

    if (payos.paymentRequests && typeof payos.paymentRequests.create === 'function') {
      paymentLinkResponse = await payos.paymentRequests.create(paymentData);
    } else if (typeof (payos as any).createPaymentLink === 'function') {
      paymentLinkResponse = await (payos as any).createPaymentLink(paymentData);
    } else {
      throw new Error('PayOS SDK method not available');
    }

    console.log(`[PayOS API] Successfully created payment link for order ${orderCode}`);

    return res.status(200).json({
      success: true,
      orderCode,
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      accountNumber: paymentLinkResponse.accountNumber,
      accountName: paymentLinkResponse.accountName,
      bin: paymentLinkResponse.bin,
      amount: paymentLinkResponse.amount,
      description: paymentLinkResponse.description || description,
      credits: finalCredits,
      packageName: packageName || `${finalCredits} lượt AI`,
    });
  } catch (err: any) {
    console.error('[PayOS Create Payment Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Không thể tạo mã thanh toán VietQR qua PayOS.',
    });
  }
}
