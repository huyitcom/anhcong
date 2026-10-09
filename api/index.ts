import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { PayOS } from '@payos/node';

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
  
  let ext = 'jpg';
  if (order.designImageData) {
    if (order.designImageData.includes('image/webp')) ext = 'webp';
    else if (order.designImageData.includes('image/jpeg') || order.designImageData.includes('image/jpg')) ext = 'jpg';
    else if (order.designImageData.includes('image/png')) ext = 'png';
  }

  const fileName = `Anh_Cong_${groomSlug}_${brideSlug}_${Date.now()}.${ext}`;
  let downloadUrl: string | undefined;

  if (order.designImageData && order.designImageData.startsWith('data:image')) {
    try {
      const base64Data = order.designImageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');

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

    if (imageBuffer) {
      mailOptions.attachments = [
        {
          filename: fileName,
          content: imageBuffer,
          cid: 'designImagePreview',
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

// Detect natural dimensions and closest Gemini aspect ratio from image buffer
function detectImageAspectRatioFromBuffer(buffer: Buffer): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' {
  let width = 0;
  let height = 0;

  if (buffer && buffer.length >= 24) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    } else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
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
    { key: '9:16', val: 9 / 16 },
    { key: '3:4', val: 3 / 4 },
    { key: '1:1', val: 1.0 },
    { key: '4:3', val: 4 / 3 },
    { key: '16:9', val: 16 / 9 },
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

// Inlined Lighting Restoration prompt for 100% self-contained serverless execution
const LIGHTING_RESTORATION_PROMPT = `ROLE:
Professional Wedding Photo Editor and Photo Restoration Specialist.

TASK:
Restore and professionally correct the exposure and lighting of the uploaded wedding photograph.

This is an EXPOSURE RESTORATION and PHOTO ENHANCEMENT task ONLY.

Do NOT replace the background.
Do NOT change the composition.
Do NOT regenerate the subjects.
Do NOT reinterpret the photograph.

The goal is to recover the photographic information hidden in the dark areas and make the original photograph look naturally well-exposed, clean and professionally photographed.

==================================================
1. PRESERVE THE ORIGINAL PHOTOGRAPH
==================================================

Treat the uploaded image as the original source photograph.

Preserve exactly:
- all people, identity, facial features, facial expression, eyes, nose, mouth
- hairstyle, hairline, skin texture, skin tone, body proportions, body shape, pose, hands
- wedding dress, suit, bouquet, veil, jewelry, clothing details
- original framing, original composition, original camera perspective, original background

Do not redraw or reconstruct the people. Do not change their appearance.

==================================================
2. RECOVER THE UNDEREXPOSED IMAGE
==================================================

Carefully recover the dark areas while maintaining realistic photographic contrast.
Increase: overall exposure, shadow detail, midtone brightness, facial visibility, clothing detail, background detail.
Lift the shadows gradually and naturally. Reveal natural detail in the groom's black suit while keeping it genuinely black.
Brighten the bride's face and dress naturally without overexposing the white fabric. Preserve highlight detail in the wedding dress.
Do NOT simply increase brightness globally. Use intelligent tonal recovery similar to professional RAW photo development.

==================================================
3. FACE AND SKIN
==================================================

Recover facial visibility naturally. Make the faces clearly visible while preserving their exact original appearance.
Do NOT change facial structure or expression, do NOT enlarge eyes, reshape nose, or excessively smooth the face.
Preserve realistic skin texture. The faces should look like the same people photographed with better exposure.

==================================================
4. WEDDING DRESS & SUIT
==================================================

Maintain natural white color, fabric texture, folds, and highlights in the wedding dress without clipping.
Maintain the groom's suit as deep black formal suit with subtle natural folds and texture recovered from shadows.

OUTPUT REQUIREMENT:
Return ONLY the professionally restored photograph. Clean, natural, and wedding print ready.`;

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

  // Support large Base64 image payload (up to 100MB)
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

  // API Health Check
  apiRouter.get(['/health', '/healthz'], (req, res) => {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(geminiKey),
      geminiKeyLength: geminiKey.length,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'vercel' : 'local',
      supportedRoutes: [
        '/api/health',
        '/api/order/submit',
        '/api/payos/create-payment',
        '/api/payos/check-status/:orderCode',
        '/api/payos/webhook',
        '/api/ai/replace-background',
        '/api/ai/restore-lighting',
      ],
    });
  });

  // Receive and Process Master Print Order
  apiRouter.post(['/order/submit', '/submit'], async (req, res) => {
    try {
      const order: OrderPayload = req.body;
      if (!order.groomName || !order.brideName) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin tên Dâu Rể bắt buộc.' });
      }

      console.log(`[Order Received] ${order.groomName} & ${order.brideName} | Phone: ${order.customerPhone}`);

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const emailResult = await sendOrderEmail(order, baseUrl);

      return res.json({
        success: true,
        message: 'Đơn đặt in ảnh cổng cưới đã được tiếp nhận thành công!',
        emailSent: emailResult.success,
        targetEmail: emailResult.targetEmail,
        fileName: emailResult.fileName,
        downloadUrl: emailResult.downloadUrl,
      });
    } catch (err: any) {
      console.error('[Order Processing Error]', err);
      return res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý đơn đặt in.' });
    }
  });

  // Create PayOS VietQR Payment Link
  apiRouter.post(['/payos/create-payment', '/create-payment'], async (req, res) => {
    try {
      const {
        amount,
        packageName,
        creditsAmount,
        userId,
        userEmail,
        returnUrl,
        cancelUrl,
      } = req.body;

      if (!amount || !creditsAmount || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin thanh toán (amount, creditsAmount, userId).',
        });
      }

      const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100));
      const description = `PBVN ${creditsAmount}luot`.slice(0, 25);

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const fallbackReturn = `${protocol}://${host}/?payment_status=success&orderCode=${orderCode}`;
      const fallbackCancel = `${protocol}://${host}/?payment_status=cancelled&orderCode=${orderCode}`;

      const paymentData = {
        orderCode,
        amount: Math.round(Number(amount)),
        description,
        returnUrl: returnUrl || fallbackReturn,
        cancelUrl: cancelUrl || fallbackCancel,
      };

      console.log(`[PayOS] Creating payment link for order ${orderCode}:`, paymentData);

      const paymentLinkResponse = await payos.createPaymentLink(paymentData);

      const orderRecord: PayosOrderRecord = {
        orderCode,
        userId,
        userEmail: userEmail || '',
        packageName: packageName || `${creditsAmount} lượt AI`,
        creditsAmount: Number(creditsAmount),
        amountVnd: Number(amount),
        status: 'PENDING',
        createdAt: Date.now(),
        checkoutUrl: paymentLinkResponse.checkoutUrl,
        qrCode: paymentLinkResponse.qrCode,
        accountNumber: paymentLinkResponse.accountNumber,
        accountName: paymentLinkResponse.accountName,
        bin: paymentLinkResponse.bin,
        description,
      };

      payosOrdersCache.set(orderCode, orderRecord);

      return res.json({
        success: true,
        orderCode,
        checkoutUrl: paymentLinkResponse.checkoutUrl,
        qrCode: paymentLinkResponse.qrCode,
        accountNumber: paymentLinkResponse.accountNumber,
        accountName: paymentLinkResponse.accountName,
        bin: paymentLinkResponse.bin,
        amount: paymentLinkResponse.amount,
        description,
      });
    } catch (err: any) {
      console.error('[PayOS Create Payment Error]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Không thể tạo mã thanh toán VietQR qua PayOS.',
      });
    }
  });

  // Check PayOS Payment Status
  apiRouter.get(['/payos/check-status/:orderCode', '/check-status/:orderCode'], async (req, res) => {
    try {
      const orderCode = Number(req.params.orderCode);
      if (!orderCode) {
        return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng orderCode.' });
      }

      const cached = payosOrdersCache.get(orderCode);

      try {
        const paymentInfo = await payos.getPaymentLinkInformation(orderCode);
        console.log(`[PayOS Check Status] Order ${orderCode} status: ${paymentInfo.status}`);

        let normalizedStatus: 'PENDING' | 'PAID' | 'CANCELLED' = 'PENDING';
        if (paymentInfo.status === 'PAID') {
          normalizedStatus = 'PAID';
        } else if (paymentInfo.status === 'CANCELLED' || paymentInfo.status === 'EXPIRED') {
          normalizedStatus = 'CANCELLED';
        }

        if (cached) {
          cached.status = normalizedStatus;
          if (normalizedStatus === 'PAID' && !cached.paidAt) {
            cached.paidAt = Date.now();
          }
          payosOrdersCache.set(orderCode, cached);
        }

        return res.json({
          success: true,
          orderCode,
          status: normalizedStatus,
          isPaid: normalizedStatus === 'PAID',
          creditsAmount: cached?.creditsAmount || 0,
          userId: cached?.userId || '',
          amount: paymentInfo.amount,
          rawStatus: paymentInfo.status,
        });
      } catch (payosErr: any) {
        if (cached) {
          return res.json({
            success: true,
            orderCode,
            status: cached.status,
            isPaid: cached.status === 'PAID',
            creditsAmount: cached.creditsAmount,
            userId: cached.userId,
            amount: cached.amountVnd,
          });
        }
        throw payosErr;
      }
    } catch (err: any) {
      console.error('[PayOS Check Status Error]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Không thể kiểm tra trạng thái đơn hàng PayOS.',
      });
    }
  });

  // PayOS Webhook
  apiRouter.post(['/payos/webhook', '/webhook'], async (req, res) => {
    try {
      const webhookBody = req.body;
      console.log('[PayOS Webhook Received]', JSON.stringify(webhookBody));

      const webhookData = payos.verifyPaymentWebhookData(webhookBody);
      const data = webhookData || webhookBody?.data || webhookBody;

      const orderCode = Number(data?.orderCode);
      const isSuccess =
        data.code === '00' ||
        webhookData.code === '00' ||
        data.status === 'PAID' ||
        webhookData.status === 'PAID' ||
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

  // AI Background Replacement Endpoint
  apiRouter.post(['/ai/replace-background', '/replace-background'], async (req, res) => {
    try {
      const {
        image,
        themeTitle,
        themePrompt,
        customPrompt,
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

      let cleanMime = (mimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(cleanMime)) {
        cleanMime = 'image/jpeg';
      }
      mimeType = cleanMime;

      const rawImageBuffer = Buffer.from(base64Data, 'base64');
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);

      let validAspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = detectedRatio;
      if (aspectRatio && ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)) {
        validAspectRatio = aspectRatio;
      }

      let validImageSize: '1K' | '2K' | '4K' = '1K';
      if (['1K', '2K', '4K'].includes(imageSize)) {
        validImageSize = imageSize;
      }

      console.log(`[AI Background Replacement] Starting generation with size: ${validImageSize}, aspect: ${validAspectRatio} (detected: ${detectedRatio})`);

      const chosenTheme = themeTitle || 'Phong Cách Đám Cưới Sang Trọng';
      const promptDetails = customPrompt || themePrompt || 'A luxurious, elegant high-end wedding venue with soft cinematic warm lighting, romantic floral decorations, bokeh background, maintaining photographic realism.';

      const apiKey = (
        req.headers['x-gemini-api-key'] ||
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
          message: 'Chưa tìm thấy biến môi trường GEMINI_API_KEY. Vui lòng thêm biến môi trường này trên trang quản lý Vercel Project Settings > Environment Variables, sau đó redeploy.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const finalPrompt = `Professional Wedding Photo Retouching & Background Replacement:
Keep the bride and groom exactly as they are in the original photo: preserve their faces, identities, expressions, hairstyles, poses, wedding outfits, flowers, and natural skin tones completely intact and razor sharp.
Seamlessly replace ONLY the background with a stunning new environment:
Theme: "${chosenTheme}".
Details: "${promptDetails}".
Ensure natural lighting integration, matching color temperature, realistic shadows on the subjects, depth of field, and perfect edge blending around hair and veil. The final result must look like a high-end luxury editorial wedding photograph.`;

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
              text: finalPrompt,
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
        return res.status(500).json({
          success: false,
          error: generatedText || 'AI không thể tạo được hình ảnh thay nền. Vui lòng thử lại với ảnh hoặc góc chụp khác.',
        });
      }

      const aiFileName = `ai_bg_${Date.now()}.png`;
      const aiFilePath = path.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn('[AI Storage] Could not persist generated file to disk:', writeErr);
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;

      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        staticUrl,
        fileName: aiFileName,
        theme: chosenTheme,
        resolution: validImageSize,
      });
    } catch (err: any) {
      console.error('[AI Replace Background Error]', err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429');
      const isSuspended = errMsg.includes('CONSUMER_SUSPENDED') || errMsg.includes('suspended');
      const isKeyInvalid = errMsg.includes('API key not valid') || (errMsg.includes('INVALID_ARGUMENT') && errMsg.includes('key'));

      let userFriendlyMessage = `Lỗi xử lý AI: ${errMsg}`;
      if (isKeyInvalid) {
        userFriendlyMessage = 'Khóa GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API Key trên Google AI Studio.';
      } else if (isSuspended) {
        userFriendlyMessage = 'Khóa API Google Cloud của dự án đang bị tạm dừng (CONSUMER_SUSPENDED). Vui lòng kiểm tra trạng thái thanh toán trên Google Cloud Console.';
      } else if (isQuotaError) {
        userFriendlyMessage = 'Hệ thống đã đạt giới hạn yêu cầu AI (429 Quota limit). Tính năng thay nền AI cần kích hoạt gói tài nguyên Google Cloud (Paid API Key). Vui lòng cấu hình thanh toán để tiếp tục sử dụng không giới hạn.';
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

  // AI Lighting Restoration Endpoint ("Cứu Sáng")
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

      let cleanMime = (mimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(cleanMime)) {
        cleanMime = 'image/jpeg';
      }
      mimeType = cleanMime;

      const rawImageBuffer = Buffer.from(base64Data, 'base64');
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);

      let validAspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = detectedRatio;
      if (aspectRatio && ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)) {
        validAspectRatio = aspectRatio;
      }

      let validImageSize: '1K' | '2K' | '4K' = '1K';
      if (['1K', '2K', '4K'].includes(imageSize)) {
        validImageSize = imageSize;
      }

      console.log(`[AI Lighting Restoration] Starting lighting restoration, size: ${validImageSize}, aspect: ${validAspectRatio} (detected: ${detectedRatio})`);

      const apiKey = (
        req.headers['x-gemini-api-key'] ||
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

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    const matchedPath = req.headers?.['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    }
    app(req, res);
  });
}
