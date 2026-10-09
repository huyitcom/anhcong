import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

// Thư mục lưu tạm trên Vercel (/tmp)
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

// Nhận diện tỉ lệ ảnh
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

const LIGHTING_RESTORATION_PROMPT = `ROLE:
Professional Wedding Photo Editor and Photo Restoration Specialist.

TASK:
Restore and professionally correct the exposure and lighting of the uploaded wedding photograph.
This is an EXPOSURE RESTORATION and PHOTO ENHANCEMENT task ONLY.
Do NOT replace the background. Do NOT change composition. Do NOT regenerate subjects.
Preserve all facial features, likeness, clothes, texture, and wedding dress details.
Lift shadows naturally, recover details from dark suit and underexposed faces.`;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    const { image, prompt, aspectRatio, imageSize = '1K' } = body || {};

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

    const apiKey = (
      req.headers['x-gemini-api-key'] ||
      body?.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel/hệ thống.',
        message: 'Chưa tìm thấy biến môi trường GEMINI_API_KEY. Vui lòng vào Vercel Settings > Environment Variables > thêm GEMINI_API_KEY > sau đó Redeploy.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const restorationPrompt = (prompt && typeof prompt === 'string' && prompt.trim().length > 0)
      ? prompt.trim()
      : LIGHTING_RESTORATION_PROMPT;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: restorationPrompt },
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
        error: generatedText || 'AI không thể tạo được hình ảnh cứu sáng. Vui lòng thử lại.',
      });
    }

    const aiFileName = `ai_lighting_${Date.now()}.png`;
    const aiFilePath = path.join(UPLOADS_DIR, aiFileName);
    try {
      const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(aiFilePath, imgBuffer);
    } catch (writeErr) {
      console.warn('[AI Storage] Could not write to disk:', writeErr);
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'photobookvietnam.net';
    const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;

    return res.status(200).json({
      success: true,
      imageUrl: generatedImageUrl,
      staticUrl,
      fileName: aiFileName,
      resolution: validImageSize,
    });
  } catch (err: any) {
    console.error('[AI Lighting Restoration Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      message: `Lỗi xử lý cứu sáng AI: ${err?.message || err}`,
    });
  }
}
