import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { PayOS } from '@payos/node';
import { LIGHTING_RESTORATION_PROMPT } from './src/data/lightingRestorationPrompt';

// PayOS VietQR Payment Configuration
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '5f6bbed7-e4c7-4fde-82e5-1290a6b55167';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '64d99978-d52c-4f37-88bd-b2a3d4da42a8';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '9b00ffc968a8ea8599a3f2ec7c935675cc7dd043ad9df2020491478e124b50b6';

const payos = new PayOS({
  clientId: PAYOS_CLIENT_ID,
  apiKey: PAYOS_API_KEY,
  checksumKey: PAYOS_CHECKSUM_KEY,
});

interface PayosOrderRecord {
  orderCode: number;
  userId: string;
  userEmail: string;
  packageName: string;
  creditsAmount: number;
  amountVnd: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: number;
  paidAt?: number;
  checkoutUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  description?: string;
}

const payosOrdersCache = new Map<number, PayosOrderRecord>();

interface OrderPayload {
  groomName?: string;
  brideName?: string;
  connector?: string;
  weddingDate?: string;
  size?: string;
  materialId?: string;
  materialName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  designImageData?: string | null;
  timestamp?: string;
}

// Ensure uploads folder exists (use /tmp on Vercel/serverless environments)
const UPLOADS_DIR = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Could not create uploads directory:', e);
}

// SMTP Configuration from Photobook Vietnam
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  user: process.env.SMTP_USER || 'photobookvietnam.net@gmail.com',
  pass: process.env.SMTP_PASS || 'pmgy mera pmts gfgp',
};

// Target Notification Emails
const TARGET_EMAILS = [
  process.env.ADMIN_EMAIL || 'huyitcom@gmail.com',
  'photobookvietnam.net@gmail.com',
];

// Generate Order Email HTML Template with Direct Print Download Link & Preview
function generateOrderEmailHtml(
  order: OrderPayload,
  hasImageAttachment: boolean,
  fileName?: string,
  downloadUrl?: string
): { subject: string; html: string; text: string } {
  const groom = order.groomName || 'Chú rể';
  const bride = order.brideName || 'Cô dâu';
  const weddingDate = order.weddingDate || 'Chưa rõ';
  const size = order.size || '60 x 90 cm (Khổ Đứng Chuẩn)';
  const material = order.materialName || 'Ảnh Cổng Ép Gỗ';
  const name = order.customerName || 'Chưa cung cấp';
  const phone = order.customerPhone || 'Chưa cung cấp';
  const email = order.customerEmail || 'Không có';
  const address = order.customerAddress || 'Tư vấn giao hàng tận nơi';
  const notes = order.notes || 'Không có';

  const now = new Date();
  const timeString = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const subject = `🔔 [ĐƠN ĐẶT IN ẢNH CỔNG CƯỚI] ${groom} & ${bride} - SĐT: ${phone}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1c1917; background-color: #f5f5f4; margin: 0; padding: 20px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 24px 28px; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; color: #e0f2fe; }
    .body { padding: 24px 28px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 4px; }
    .section-title:first-child { margin-top: 0; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f5f5f4; vertical-align: top; }
    .table td.label { width: 150px; color: #78716c; font-weight: 500; }
    .table td.value { color: #1c1917; font-weight: 600; }
    .highlight { color: #0284c7; font-weight: 700; }
    .image-preview-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
    .image-preview-container img { max-width: 100%; max-height: 440px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
    .btn-container { margin: 22px 0 10px 0; text-align: center; }
    .btn-download { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-size: 14px; font-weight: 700; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(2,132,199,0.3); }
    .btn-zalo { display: inline-block; background: #0068ff; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; }
    .badge-optimized { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-top: 6px; }
    .footer { background: #fafaf9; padding: 16px 28px; font-size: 12px; color: #a8a29e; text-align: center; border-top: 1px solid #f5f5f4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🔔 CÓ ĐƠN ĐẶT IN ẢNH CỔNG CƯỚI MỚI</h1>
      <p>Ghi nhận tự động từ ứng dụng Thiết Kế & Đặt In Ảnh Cổng Cưới Photobook Vietnam</p>
    </div>
    <div class="body">
      ${
        hasImageAttachment
          ? `
      <div class="section-title">🖼 BẢN THIẾT KẾ ĐÍNH KÈM (TỐI ƯU HÓA ĐỂ IN ẤN)</div>
      <div class="image-preview-container">
        <img src="cid:designImagePreview" alt="Bản thiết kế ảnh cổng cưới" />
        <div style="margin-top: 10px;">
          <span class="badge-optimized">✓ ĐÃ TỐI ƯU NÉN NHẸ & SẮC NÉT (JPG/WEBP)</span>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
          📎 <b>File đính kèm:</b> <code>${fileName || 'Anh_Cong_Cuoi_ThietKe.jpg'}</code>
        </p>
        ${
          downloadUrl
            ? `
        <div style="margin-top: 14px;">
          <a href="${downloadUrl}" class="btn-download" target="_blank">
            📥 BẤM ĐỂ TẢI FILE GỐC ĐỘ NÉT CAO
          </a>
        </div>
        `
            : ''
        }
      </div>
      `
          : ''
      }

      <div class="section-title">THÔNG TIN SẢN PHẨM IN</div>
      <table class="table">
        <tr>
          <td class="label">Dâu Rể:</td>
          <td class="value highlight">${groom} & ${bride}</td>
        </tr>
        <tr>
          <td class="label">Ngày cưới:</td>
          <td class="value">${weddingDate}</td>
        </tr>
        <tr>
          <td class="label">Kích thước in:</td>
          <td class="value">${size}</td>
        </tr>
        <tr>
          <td class="label">Chất liệu ép gỗ:</td>
          <td class="value highlight">${material}</td>
        </tr>
      </table>

      <div class="section-title">THÔNG TIN KHÁCH HÀNG & GIAO HÀNG</div>
      <table class="table">
        <tr>
          <td class="label">Họ tên khách:</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">Số điện thoại / Zalo:</td>
          <td class="value"><a href="tel:${phone}" style="color:#0284c7; text-decoration:none; font-size:16px;">${phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email khách:</td>
          <td class="value">${email}</td>
        </tr>
        <tr>
          <td class="label">Địa chỉ giao:</td>
          <td class="value">${address}</td>
        </tr>
        <tr>
          <td class="label">Ghi chú:</td>
          <td class="value">${notes}</td>
        </tr>
        <tr>
          <td class="label">Thời gian đặt:</td>
          <td class="value" style="font-size:12px; color:#78716c;">${timeString}</td>
        </tr>
      </table>

      <div class="btn-container">
        <a href="https://zalo.me/${phone.replace(/[^0-9]/g, '')}" class="btn-zalo" target="_blank">
          💬 Bấm Để Mở Chat Zalo Với Khách Hàng
        </a>
      </div>
    </div>
    <div class="footer">
      Email thông báo đơn hàng tự động từ Photobook Vietnam (Gửi tới: <b>${TARGET_EMAILS.join(', ')}</b>).<br>
      File ảnh thiết kế tối ưu JPG/WEBP đã được đính kèm và lưu trữ sẵn sàng để in.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
ĐƠN ĐẶT IN ẢNH CỔNG CƯỚI - PHOTOBOOK VIETNAM
==============================================
- Dâu Rể: ${groom} & ${bride}
- Ngày cưới: ${weddingDate}
- Kích thước: ${size}
- Chất liệu ép gỗ: ${material}
${hasImageAttachment ? `- File thiết kế: Đính kèm trong email (${fileName})` : ''}
${downloadUrl ? `- Link tải trực tiếp file gốc: ${downloadUrl}` : ''}

THÔNG TIN KHÁCH HÀNG
- Khách hàng: ${name}
- SĐT / Zalo: ${phone}
- Email: ${email}
- Địa chỉ giao hàng: ${address}
- Ghi chú: ${notes}
- Thời gian: ${timeString}
==============================================
Chat Zalo: https://zalo.me/${phone.replace(/[^0-9]/g, '')}
`.trim();

  return { subject, html, text };
}

// Send Real Order Email via Gmail SMTP with Attachment and Download Link
async function sendOrderEmail(
  order: OrderPayload,
  baseUrl?: string
): Promise<{
  success: boolean;
  targetEmail: string;
  fileName?: string;
  downloadUrl?: string;
  error?: string;
}> {
  let imageBuffer: Buffer | null = null;
  const groomSlug = (order.groomName || 'Groom').replace(/\s+/g, '_');
  const brideSlug = (order.brideName || 'Bride').replace(/\s+/g, '_');
  
  // Determine file extension (jpg / webp / png)
  let ext = 'jpg';
  if (order.designImageData) {
    if (order.designImageData.includes('image/webp')) ext = 'webp';
    else if (order.designImageData.includes('image/jpeg') || order.designImageData.includes('image/jpg')) ext = 'jpg';
    else if (order.designImageData.includes('image/png')) ext = 'png';
  }

  let fileName = `Anh_Cong_${groomSlug}_${brideSlug}_${Date.now()}.${ext}`;
  let downloadUrl: string | undefined;

  // Process design base64 image if present
  if (order.designImageData && order.designImageData.startsWith('data:image')) {
    try {
      const base64Data = order.designImageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');

      // Save to server uploads folder
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`[Uploads] Saved design image to disk: ${filePath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

      if (baseUrl) {
        downloadUrl = `${baseUrl}/uploads/${fileName}`;
      }
    } catch (saveErr) {
      console.error('[Uploads Error] Could not save design image:', saveErr);
    }
  }

  const hasAttachment = Boolean(imageBuffer);
  const { subject, html, text } = generateOrderEmailHtml(order, hasAttachment, fileName, downloadUrl);
  const targetEmailStr = TARGET_EMAILS.join(', ');

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass,
      },
    });

    const mailOptions: any = {
      from: `"Photobook Vietnam" <${SMTP_CONFIG.user}>`,
      to: TARGET_EMAILS,
      replyTo: order.customerEmail || undefined,
      subject: subject,
      text: text,
      html: html,
    };

    // Attach image to the email and embed it
    if (imageBuffer) {
      mailOptions.attachments = [
        {
          filename: fileName,
          content: imageBuffer,
          cid: 'designImagePreview', // used in <img src="cid:designImagePreview">
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP Gmail Success] Order email sent with optimized image file! MessageId:', info.messageId);
    return {
      success: true,
      targetEmail: targetEmailStr,
      fileName: hasAttachment ? fileName : undefined,
      downloadUrl,
    };
  } catch (err: any) {
    console.error('[SMTP Gmail Error]', err);
    return { success: false, targetEmail: targetEmailStr, error: err.message };
  }
}

export function createExpressApp() {
  const app = express();

  // Avoid body-parser hanging on Vercel Serverless if req.body has already been consumed
  app.use((req, _res, next) => {
    if (req.body !== undefined && req.body !== null) {
      (req as any)._body = true;
    }
    const matchedPath = req.headers['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    }
    next();
  });

  // Support large Base64 image payload (up to 100MB for 300DPI 7087x10630 canvas)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Static directory for uploaded master print files
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Direct download route for print shop
  app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File không tồn tại hoặc đã hết hạn lưu trữ.');
    }
  });

  const apiRouter = express.Router();

  // API Health Check (used by Vercel deployment check & diagnostic)
  apiRouter.get(['/health', '/healthz'], (req, res) => {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(geminiKey),
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      smtpUser: SMTP_CONFIG.user,
      targetEmails: TARGET_EMAILS,
      uploadsDir: UPLOADS_DIR,
      isServerless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
      timestamp: new Date().toISOString(),
    });
  });

  // API: Submit order & send actual email via Gmail SMTP
  apiRouter.post(['/order/submit', '/submit'], async (req, res) => {
    const orderData: OrderPayload = req.body;
    console.log('=== [NHẬN ĐƠN ĐẶT IN MỚI 300 DPI] === Dâu rể:', orderData.groomName, orderData.brideName, 'SĐT:', orderData.customerPhone);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const emailResult = await sendOrderEmail(orderData, baseUrl);

    res.json({
      success: true,
      emailSent: emailResult.success,
      targetEmail: emailResult.targetEmail,
      fileName: emailResult.fileName,
      downloadUrl: emailResult.downloadUrl,
      error: emailResult.error,
      message: emailResult.success
        ? `Đã gửi email thông báo đơn hàng kèm file ảnh thiết kế 300 DPI thành công đến: ${emailResult.targetEmail}`
        : 'Đã lưu đơn hàng vào hệ thống.',
      order: {
        groomName: orderData.groomName,
        brideName: orderData.brideName,
        customerPhone: orderData.customerPhone,
      },
    });
  });

  // ==========================================
  // PAYOS VIETQR INTEGRATION ENDPOINTS
  // ==========================================

  // API: Create PayOS payment request
  apiRouter.post(['/payos/create-payment', '/create-payment'], async (req, res) => {
    try {
      const { userId, userEmail, packageName, creditsAmount, amountVnd } = req.body;
      if (!creditsAmount || !amountVnd) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin gói nạp (creditsAmount hoặc amountVnd).' });
      }

      // Generate unique numerical orderCode (PayOS requires an integer number up to 9007199254740991)
      const timestampPart = Number(String(Date.now()).slice(-6));
      const randomPart = Math.floor(10 + Math.random() * 89);
      const orderCode = Number(`${timestampPart}${randomPart}`);

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // PayOS description: max 25 characters, alphanumeric without special accents
      const safeDesc = `NAP ${creditsAmount} LUOT AI`.slice(0, 25);

      const paymentData = {
        orderCode,
        amount: Math.round(Number(amountVnd)),
        description: safeDesc,
        returnUrl: `${baseUrl}/?payment=success&orderCode=${orderCode}`,
        cancelUrl: `${baseUrl}/?payment=cancel&orderCode=${orderCode}`,
      };

      console.log(`[PayOS] Creating payment request for user ${userId || 'anonymous'}, orderCode: ${orderCode}, amount: ${amountVnd}`);
      const paymentResult = await payos.paymentRequests.create(paymentData);

      const record: PayosOrderRecord = {
        orderCode,
        userId: userId || 'anonymous',
        userEmail: userEmail || '',
        packageName: packageName || `${creditsAmount} Lượt`,
        creditsAmount: Number(creditsAmount),
        amountVnd: Number(amountVnd),
        status: 'PENDING',
        createdAt: Date.now(),
        checkoutUrl: paymentResult.checkoutUrl,
        qrCode: paymentResult.qrCode,
        accountNumber: paymentResult.accountNumber,
        accountName: paymentResult.accountName,
        bin: paymentResult.bin,
        description: paymentResult.description,
      };
      payosOrdersCache.set(orderCode, record);

      return res.json({
        success: true,
        orderCode,
        paymentLinkId: paymentResult.paymentLinkId,
        checkoutUrl: paymentResult.checkoutUrl,
        qrCode: paymentResult.qrCode,
        accountNumber: paymentResult.accountNumber,
        accountName: paymentResult.accountName,
        bin: paymentResult.bin,
        amount: paymentResult.amount,
        description: paymentResult.description,
        credits: creditsAmount,
        packageName,
      });
    } catch (err: any) {
      console.error('[PayOS Error creating payment]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Không thể tạo mã thanh toán PayOS',
      });
    }
  });

  // API: Check payment status in real-time
  apiRouter.get(['/payos/check-status/:orderCode', '/check-status/:orderCode'], async (req, res) => {
    try {
      const orderCode = Number(req.params.orderCode);
      if (!orderCode) {
        return res.status(400).json({ success: false, error: 'Mã đơn không hợp lệ' });
      }

      const cachedOrder = payosOrdersCache.get(orderCode);

      // If already cached as PAID
      if (cachedOrder && cachedOrder.status === 'PAID') {
        return res.json({
          success: true,
          status: 'PAID',
          isPaid: true,
          order: cachedOrder,
          creditsAmount: cachedOrder.creditsAmount,
        });
      }

      // Query PayOS directly
      const payosInfo = await payos.paymentRequests.get(orderCode);
      const isPaid = payosInfo.status === 'PAID';

      if (isPaid && cachedOrder) {
        cachedOrder.status = 'PAID';
        cachedOrder.paidAt = Date.now();
        payosOrdersCache.set(orderCode, cachedOrder);
      }

      return res.json({
        success: true,
        status: payosInfo.status,
        isPaid,
        order: cachedOrder || {
          orderCode,
          status: payosInfo.status,
          amountVnd: payosInfo.amount,
        },
        creditsAmount: cachedOrder?.creditsAmount,
      });
    } catch (err: any) {
      console.error('[PayOS Status Check Error]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi kiểm tra trạng thái thanh toán',
      });
    }
  });

  // API: Webhook callback from PayOS
  apiRouter.post(['/payos/webhook', '/webhook'], async (req, res) => {
    try {
      const webhookData = req.body;
      console.log('[PayOS Webhook Received]:', JSON.stringify(webhookData));

      let verifiedData: any = null;
      try {
        verifiedData = await payos.webhooks.verify(webhookData);
      } catch (vErr) {
        console.warn('[PayOS Webhook Verification Warning]:', vErr);
      }

      const data = verifiedData || webhookData.data || webhookData;
      const orderCode = Number(data.orderCode);

      const isSuccess =
        webhookData.code === '00' ||
        data.code === '00' ||
        webhookData.desc === 'success' ||
        data.desc === 'success';

      if (orderCode && isSuccess) {
        const order = payosOrdersCache.get(orderCode);
        if (order) {
          order.status = 'PAID';
          order.paidAt = Date.now();
          payosOrdersCache.set(orderCode, order);
          console.log(`[PayOS Webhook] Order ${orderCode} verified as PAID for user ${order.userId} (+${order.creditsAmount} credits)`);
        }
      }

      return res.json({ success: true, message: 'Webhook processed' });
    } catch (err: any) {
      console.error('[PayOS Webhook Error]', err);
      return res.status(200).json({ success: false, error: err?.message });
    }
  });

// Detect natural dimensions and closest Gemini aspect ratio from image buffer
function detectImageAspectRatioFromBuffer(buffer: Buffer): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' {
  let width = 0;
  let height = 0;

  if (buffer && buffer.length >= 24) {
    // PNG format
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    // JPEG format
    else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) { offset++; continue; }
        const marker = buffer[offset + 1];
        if ([0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF].includes(marker)) {
          if (offset + 8 < buffer.length) {
            height = buffer.readUInt16BE(offset + 5);
            width = buffer.readUInt16BE(offset + 7);
          }
          break;
        }
        if (marker === 0xD9 || marker === 0xDA) break;
        if (offset + 4 > buffer.length) break;
        const len = buffer.readUInt16BE(offset + 2);
        offset += 2 + len;
      }
    }
  }

  if (!width || !height) return '3:4';

  const ratio = width / height;
  const candidates: { key: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; val: number }[] = [
    { key: '9:16', val: 9 / 16 }, // 0.5625
    { key: '3:4', val: 3 / 4 },   // 0.75
    { key: '1:1', val: 1.0 },     // 1.0
    { key: '4:3', val: 4 / 3 },   // 1.3333
    { key: '16:9', val: 16 / 9 }, // 1.7778
  ];
  let closest = candidates[0].key;
  let minDiff = Math.abs(ratio - candidates[0].val);
  for (const c of candidates) {
    const diff = Math.abs(ratio - c.val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c.key;
    }
  }
  return closest;
}

  // API: AI Background Replacement using Gemini Image Generation
  apiRouter.post(['/ai/replace-background', '/replace-background'], async (req, res) => {
    try {
      const {
        image,
        prompt,
        aspectRatio,
        templateName,
        imageSize = '2K',
        preserveFraming = true,
      } = req.body || {};

      if (!image) {
        return res.status(400).json({ success: false, error: 'Thiếu dữ liệu hình ảnh (image).' });
      }
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Thiếu câu lệnh mô tả phông nền (prompt).' });
      }

      // Valid image sizes: '1K', '2K', '4K'
      let validImageSize: '1K' | '2K' | '4K' = '2K';
      if (['1K', '2K', '4K'].includes(imageSize)) {
        validImageSize = imageSize as any;
      }

      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (image.startsWith('data:image')) {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        }
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        const imgRes = await fetch(image);
        if (!imgRes.ok) {
          throw new Error(`Không thể tải ảnh nguồn: HTTP ${imgRes.status}`);
        }
        const arrayBuf = await imgRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        base64Data = buf.toString('base64');
      } else {
        base64Data = image;
      }

      // Sanitize mimeType to valid Gemini image MIME types (strip charset, fallback to jpeg)
      let cleanMime = (mimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(cleanMime)) {
        cleanMime = 'image/jpeg';
      }
      mimeType = cleanMime;

      // Detect orientation and aspect ratio from input image buffer
      const rawImageBuffer = Buffer.from(base64Data, 'base64');
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);

      // Valid aspect ratios for Gemini Image: '1:1', '3:4', '4:3', '9:16', '16:9'
      let validAspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = detectedRatio;
      if (aspectRatio && ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)) {
        validAspectRatio = aspectRatio as any;
      }

      console.log(`[AI Background] Starting replacement with template: ${templateName || 'custom'}, size: ${validImageSize}, aspect: ${validAspectRatio}`);

      const apiKey = (
        (req.headers['x-gemini-api-key'] as string) ||
        req.body?.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        ''
      ).trim();

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel/hệ thống.',
          message: 'Chưa tìm thấy biến môi trường GEMINI_API_KEY. Nếu bạn vừa thêm trên Vercel, vui lòng vào tab Deployments > nhấn nút ... > chọn Redeploy để Vercel nạp biến môi trường mới.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Build master prompt with strict face and identity preservation rules
      const masterPrompt = `
CRITICAL INSTRUCTIONS FOR PHOTO EDITING & IDENTITY PRESERVATION:
1. STRICT FACE & IDENTITY LOCK:
   - You MUST keep the EXACT original faces of both the bride and the groom 100% identical and unchanged.
   - Do NOT regenerate, reshape, swap, beautify, smooth out, or alter their eyes, eyebrows, nose, mouth, smile, teeth, jawline, skin tone, or hairstyle.
   - The facial features, expressions, and genuine facial likeness must remain perfectly true to the original people.

2. PRESERVE ORIGINAL FRAMING & SUBJECT SCALE:
   ${
     preserveFraming
       ? '- The couple in the input photo must remain in the foreground at their EXACT SAME SCALE, zoom level, and cropping. If the input image is a half-body / waist-up shot, DO NOT zoom out to show full-length feet or floor. Keep them in the medium close-up foreground. Position the background decorative elements (arch, doorway, florals) harmoniously BEHIND and AROUND them at their current scale.'
       : '- Maintain natural realistic proportions for the couple without distorting or minimizing them.'
   }

3. PRESERVE ATTIRE & ACCESSORIES:
   - Keep the bride\'s wedding dress, veil, jewelry, hairstyle, and bouquet intact.
   - Keep the groom\'s tuxedo/suit, bow tie/tie, and accessories intact.

4. SEAMLESS BACKGROUND COMPOSITING:
   - ONLY replace the background behind and around the couple with the specified scene below.
   - Seamlessly harmonize lighting, directional rim light, shadows, and subtle color reflections so the subjects look as though they were originally photographed in this new location.

TARGET BACKGROUND SCENE:
${prompt}
`.trim();

      console.log(`[AI Background] Calling Gemini model with size ${validImageSize} and prompt length ${masterPrompt.length}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: masterPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio,
            imageSize: validImageSize,
          },
        },
      });

      let generatedImageUrl: string | null = null;
      let generatedText: string | null = null;

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgMime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${imgMime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          generatedText = part.text;
        }
      }

      if (!generatedImageUrl) {
        console.warn('[AI Background] Model returned no image part. Text:', generatedText);
        return res.status(500).json({
          success: false,
          error: generatedText || 'AI không thể tạo được hình ảnh cho phông nền này. Vui lòng thử lại với mẫu phông nền khác.',
        });
      }

      // Also save to uploads directory so it can be downloaded directly (if filesystem is writable)
      const aiFileName = `ai_bg_${Date.now()}.png`;
      const aiFilePath = path.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn('[AI Background Storage] Could not persist generated file to disk:', writeErr);
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;

      console.log(`[AI Background] Success! Generated image saved to ${aiFilePath}`);

      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        staticUrl,
        fileName: aiFileName,
        resolution: validImageSize,
      });
    } catch (err: any) {
      console.error('[AI Background Error]', err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429');
      const isSuspended = errMsg.includes('CONSUMER_SUSPENDED') || errMsg.includes('suspended');

      let userFriendlyMessage = `Lỗi xử lý AI: ${errMsg}`;
      if (isSuspended) {
        userFriendlyMessage = 'Khóa API Google Cloud của dự án đang bị tạm dừng (CONSUMER_SUSPENDED). Bạn vui lòng kiểm tra trạng thái tài khoản thanh toán trên Google Cloud Console hoặc chọn dự án khác.';
      } else if (isQuotaError) {
        userFriendlyMessage = 'Tính năng Thay Nền AI cần kích hoạt gói tài nguyên Google Cloud (Paid API Key). Vui lòng cấu hình thanh toán để tiếp tục sử dụng không giới hạn.';
      }

      return res.status(500).json({
        success: false,
        error: errMsg,
        isQuotaError,
        isSuspended,
        message: userFriendlyMessage,
      });
    }
  });

  // API: AI Exposure & Lighting Restoration (Cứu Sáng)
  apiRouter.post(['/ai/restore-lighting', '/restore-lighting'], async (req, res) => {
    try {
      const {
        image,
        prompt,
        aspectRatio,
        imageSize = '1K',
      } = req.body || {};

      if (!image) {
        return res.status(400).json({ success: false, error: 'Thiếu dữ liệu hình ảnh (image).' });
      }

      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (image.startsWith('data:image')) {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        }
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        const imgRes = await fetch(image);
        if (!imgRes.ok) {
          throw new Error(`Không thể tải ảnh nguồn: HTTP ${imgRes.status}`);
        }
        const arrayBuf = await imgRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        base64Data = buf.toString('base64');
      } else {
        base64Data = image;
      }

      // Sanitize mimeType to valid Gemini image MIME types (strip charset, fallback to jpeg)
      let cleanMime = (mimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(cleanMime)) {
        cleanMime = 'image/jpeg';
      }
      mimeType = cleanMime;

      // Auto-detect orientation and aspect ratio from the input image buffer
      const rawImageBuffer = Buffer.from(base64Data, 'base64');
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);

      // Valid aspect ratios for Gemini: '1:1', '3:4', '4:3', '9:16', '16:9'
      let validAspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = detectedRatio;
      if (aspectRatio && ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)) {
        validAspectRatio = aspectRatio as any;
      }

      let validImageSize: '1K' | '2K' | '4K' = '1K';
      if (['1K', '2K', '4K'].includes(imageSize)) {
        validImageSize = imageSize as any;
      }

      console.log(`[AI Lighting Restoration] Starting lighting restoration, size: ${validImageSize}, aspect: ${validAspectRatio} (detected: ${detectedRatio})`);

      const apiKey = (
        (req.headers['x-gemini-api-key'] as string) ||
        req.body?.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        ''
      ).trim();

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel/hệ thống.',
          message: 'Chưa tìm thấy biến môi trường GEMINI_API_KEY. Nếu bạn vừa thêm trên Vercel, vui lòng vào tab Deployments > nhấn nút ... > chọn Redeploy để Vercel nạp biến môi trường mới.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const restorationPrompt = (prompt && typeof prompt === 'string' && prompt.trim().length > 0)
        ? prompt.trim()
        : LIGHTING_RESTORATION_PROMPT;

      console.log(`[AI Lighting Restoration] Calling Gemini model with prompt length ${restorationPrompt.length}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: restorationPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio,
            imageSize: validImageSize,
          },
        },
      });

      let generatedImageUrl: string | null = null;
      let generatedText: string | null = null;

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgMime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${imgMime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          generatedText = part.text;
        }
      }

      if (!generatedImageUrl) {
        console.warn('[AI Lighting Restoration] Model returned no image part. Text:', generatedText);
        return res.status(500).json({
          success: false,
          error: generatedText || 'AI không thể tạo được hình ảnh cứu sáng. Vui lòng thử lại.',
        });
      }

      const aiFileName = `ai_lighting_${Date.now()}.png`;
      const aiFilePath = path.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn('[AI Lighting Storage] Could not persist generated file to disk:', writeErr);
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;

      console.log(`[AI Lighting Restoration] Success! Restored image saved to ${aiFilePath}`);

      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        staticUrl,
        fileName: aiFileName,
        resolution: validImageSize,
      });
    } catch (err: any) {
      console.error('[AI Lighting Restoration Error]', err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429');
      const isSuspended = errMsg.includes('CONSUMER_SUSPENDED') || errMsg.includes('suspended');
      const isKeyInvalid = errMsg.includes('API key not valid') || (errMsg.includes('INVALID_ARGUMENT') && errMsg.includes('key'));

      let userFriendlyMessage = `Lỗi xử lý cứu sáng AI: ${errMsg}`;
      if (isKeyInvalid) {
        userFriendlyMessage = 'Khóa GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API Key trên Google AI Studio.';
      } else if (isSuspended) {
        userFriendlyMessage = 'Khóa API Google Cloud của dự án đang bị tạm dừng (CONSUMER_SUSPENDED). Vui lòng kiểm tra trạng thái thanh toán trên Google Cloud Console.';
      } else if (isQuotaError) {
        userFriendlyMessage = 'Hệ thống đã đạt giới hạn yêu cầu AI (429 Quota limit). Vui lòng đợi 1 phút và thử lại.';
      }

      return res.status(500).json({
        success: false,
        error: errMsg,
        message: userFriendlyMessage,
      });
    }
  });

  // Mount API router on both '/api' and '/'
  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}

export const app = createExpressApp();

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server when executed directly as entrypoint, NOT when imported in Vercel Serverless
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTION_NAME
);

if (!isServerless) {
  startServer();
}

export default app;
