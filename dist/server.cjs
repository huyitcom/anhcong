"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_express2 = __toESM(require("express"), 1);

// api/index.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_genai = require("@google/genai");
var import_node = require("@payos/node");

// api/cloudinary.ts
var import_cloudinary = require("cloudinary");
var CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "tq2yiygt";
var API_KEY = process.env.CLOUDINARY_API_KEY || "831334161118296";
var API_SECRET = process.env.CLOUDINARY_API_SECRET || "OCijUGp73Y8KI1W1sP7OxHbH8Bo";
import_cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});
async function uploadRenderToCloudinary(base64OrUrl, options) {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.warn("[Cloudinary] Missing credentials, skipping upload");
      return null;
    }
    const publicId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const result = await import_cloudinary.v2.uploader.upload(base64OrUrl, {
      folder: "ai-wedding-renders",
      public_id: publicId,
      resource_type: "image",
      tags: ["ai_render", options?.templateName || "wedding_bg"].filter(Boolean),
      context: {
        userId: options?.userId || "",
        template: options?.templateName || "",
        resolution: options?.resolution || ""
      }
    });
    console.log("[Cloudinary] Rendered image uploaded successfully:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary Upload Error]", error);
    return null;
  }
}

// api/index.ts
import_dotenv.default.config();
var PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "5f6bbed7-e4c7-4fde-82e5-1290a6b55167";
var PAYOS_API_KEY = process.env.PAYOS_API_KEY || "64d99978-d52c-4f37-88bd-b2a3d4da42a8";
var PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "9b00ffc968a8ea8599a3f2ec7c935675cc7dd043ad9df2020491478e124b50b6";
var payos = new import_node.PayOS({
  clientId: PAYOS_CLIENT_ID,
  apiKey: PAYOS_API_KEY,
  checksumKey: PAYOS_CHECKSUM_KEY
});
var payosOrdersCache = /* @__PURE__ */ new Map();
var UPLOADS_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? import_path.default.join("/tmp", "uploads") : import_path.default.join(process.cwd(), "uploads");
try {
  if (!import_fs.default.existsSync(UPLOADS_DIR)) {
    import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Storage] Could not create uploads directory:", e);
}
var SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  user: process.env.SMTP_USER || "photobookvietnam.net@gmail.com",
  pass: process.env.SMTP_PASS || "pmgy mera pmts gfgp"
};
var TARGET_EMAILS = [
  process.env.ADMIN_EMAIL || "huyitcom@gmail.com",
  "photobookvietnam.net@gmail.com"
];
function generateOrderEmailHtml(order, hasImageAttachment, fileName, downloadUrl) {
  const groom = order.groomName || "Ch\xFA r\u1EC3";
  const bride = order.brideName || "C\xF4 d\xE2u";
  const weddingDate = order.weddingDate || "Ch\u01B0a r\xF5";
  const size = order.size || "60 x 90 cm (Kh\u1ED5 \u0110\u1EE9ng Chu\u1EA9n)";
  const material = order.materialName || "\u1EA2nh C\u1ED5ng \xC9p G\u1ED7";
  const name = order.customerName || "Ch\u01B0a cung c\u1EA5p";
  const phone = order.customerPhone || "Ch\u01B0a cung c\u1EA5p";
  const email = order.customerEmail || "Kh\xF4ng c\xF3";
  const address = order.customerAddress || "T\u01B0 v\u1EA5n giao h\xE0ng t\u1EADn n\u01A1i";
  const notes = order.notes || "Kh\xF4ng c\xF3";
  const now = /* @__PURE__ */ new Date();
  const timeString = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const subject = `\u{1F514} [\u0110\u01A0N \u0110\u1EB6T IN \u1EA2NH C\u1ED4NG C\u01AF\u1EDAI] ${groom} & ${bride} - S\u0110T: ${phone}`;
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
      <h1>\u{1F514} C\xD3 \u0110\u01A0N \u0110\u1EB6T IN \u1EA2NH C\u1ED4NG C\u01AF\u1EDAI M\u1EDAI</h1>
      <p>Ghi nh\u1EADn t\u1EF1 \u0111\u1ED9ng t\u1EEB \u1EE9ng d\u1EE5ng Thi\u1EBFt K\u1EBF & \u0110\u1EB7t In \u1EA2nh C\u1ED5ng C\u01B0\u1EDBi Photobook Vietnam</p>
    </div>
    <div class="body">
      ${hasImageAttachment ? `
      <div class="section-title">\u{1F5BC} B\u1EA2N THI\u1EBET K\u1EBE \u0110\xCDNH K\xC8M (T\u1ED0I \u01AFU H\xD3A \u0110\u1EC2 IN \u1EA4N)</div>
      <div class="image-preview-container">
        <img src="cid:designImagePreview" alt="B\u1EA3n thi\u1EBFt k\u1EBF \u1EA3nh c\u1ED5ng c\u01B0\u1EDBi" />
        <div style="margin-top: 10px;">
          <span class="badge-optimized">\u2713 \u0110\xC3 T\u1ED0I \u01AFU N\xC9N NH\u1EB8 & S\u1EAEC N\xC9T (JPG/WEBP)</span>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
          \u{1F4CE} <b>File \u0111\xEDnh k\xE8m:</b> <code>${fileName || "Anh_Cong_Cuoi_ThietKe.jpg"}</code>
        </p>
        ${downloadUrl ? `
        <div style="margin-top: 14px;">
          <a href="${downloadUrl}" class="btn-download" target="_blank">
            \u{1F4E5} B\u1EA4M \u0110\u1EC2 T\u1EA2I FILE G\u1ED0C \u0110\u1ED8 N\xC9T CAO
          </a>
        </div>
        ` : ""}
      </div>
      ` : ""}

      <div class="section-title">TH\xD4NG TIN S\u1EA2N PH\u1EA8M IN</div>
      <table class="table">
        <tr>
          <td class="label">D\xE2u R\u1EC3:</td>
          <td class="value highlight">${groom} & ${bride}</td>
        </tr>
        <tr>
          <td class="label">Ng\xE0y c\u01B0\u1EDBi:</td>
          <td class="value">${weddingDate}</td>
        </tr>
        <tr>
          <td class="label">K\xEDch th\u01B0\u1EDBc in:</td>
          <td class="value">${size}</td>
        </tr>
        <tr>
          <td class="label">Ch\u1EA5t li\u1EC7u \xE9p g\u1ED7:</td>
          <td class="value highlight">${material}</td>
        </tr>
      </table>

      <div class="section-title">TH\xD4NG TIN KH\xC1CH H\xC0NG & GIAO H\xC0NG</div>
      <table class="table">
        <tr>
          <td class="label">H\u1ECD t\xEAn kh\xE1ch:</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">S\u1ED1 \u0111i\u1EC7n tho\u1EA1i / Zalo:</td>
          <td class="value"><a href="tel:${phone}" style="color:#0284c7; text-decoration:none; font-size:16px;">${phone}</a></td>
        </tr>
        <tr>
          <td class="label">Email kh\xE1ch:</td>
          <td class="value">${email}</td>
        </tr>
        <tr>
          <td class="label">\u0110\u1ECBa ch\u1EC9 giao:</td>
          <td class="value">${address}</td>
        </tr>
        <tr>
          <td class="label">Ghi ch\xFA:</td>
          <td class="value">${notes}</td>
        </tr>
        <tr>
          <td class="label">Th\u1EDDi gian \u0111\u1EB7t:</td>
          <td class="value" style="font-size:12px; color:#78716c;">${timeString}</td>
        </tr>
      </table>

      <div class="btn-container">
        <a href="https://zalo.me/${phone.replace(/[^0-9]/g, "")}" class="btn-zalo" target="_blank">
          \u{1F4AC} B\u1EA5m \u0110\u1EC3 M\u1EDF Chat Zalo V\u1EDBi Kh\xE1ch H\xE0ng
        </a>
      </div>
    </div>
    <div class="footer">
      Email th\xF4ng b\xE1o \u0111\u01A1n h\xE0ng t\u1EF1 \u0111\u1ED9ng t\u1EEB Photobook Vietnam (G\u1EEDi t\u1EDBi: <b>${TARGET_EMAILS.join(", ")}</b>).<br>
      File \u1EA3nh thi\u1EBFt k\u1EBF t\u1ED1i \u01B0u JPG/WEBP \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\xEDnh k\xE8m v\xE0 l\u01B0u tr\u1EEF s\u1EB5n s\xE0ng \u0111\u1EC3 in.
    </div>
  </div>
</body>
</html>
  `.trim();
  const text = `
\u0110\u01A0N \u0110\u1EB6T IN \u1EA2NH C\u1ED4NG C\u01AF\u1EDAI - PHOTOBOOK VIETNAM
==============================================
- D\xE2u R\u1EC3: ${groom} & ${bride}
- Ng\xE0y c\u01B0\u1EDBi: ${weddingDate}
- K\xEDch th\u01B0\u1EDBc: ${size}
- Ch\u1EA5t li\u1EC7u \xE9p g\u1ED7: ${material}
${hasImageAttachment ? `- File thi\u1EBFt k\u1EBF: \u0110\xEDnh k\xE8m trong email (${fileName})` : ""}
${downloadUrl ? `- Link t\u1EA3i tr\u1EF1c ti\u1EBFp file g\u1ED1c: ${downloadUrl}` : ""}

TH\xD4NG TIN KH\xC1CH H\xC0NG
- Kh\xE1ch h\xE0ng: ${name}
- S\u0110T / Zalo: ${phone}
- Email: ${email}
- \u0110\u1ECBa ch\u1EC9 giao h\xE0ng: ${address}
- Ghi ch\xFA: ${notes}
- Th\u1EDDi gian: ${timeString}
==============================================
Chat Zalo: https://zalo.me/${phone.replace(/[^0-9]/g, "")}
`.trim();
  return { subject, html, text };
}
async function sendOrderEmail(order, baseUrl) {
  let imageBuffer = null;
  const groomSlug = (order.groomName || "Groom").replace(/\s+/g, "_");
  const brideSlug = (order.brideName || "Bride").replace(/\s+/g, "_");
  let ext = "jpg";
  if (order.designImageData) {
    if (order.designImageData.includes("image/webp")) ext = "webp";
    else if (order.designImageData.includes("image/jpeg") || order.designImageData.includes("image/jpg")) ext = "jpg";
    else if (order.designImageData.includes("image/png")) ext = "png";
  }
  const fileName = `Anh_Cong_${groomSlug}_${brideSlug}_${Date.now()}.${ext}`;
  let downloadUrl;
  if (order.designImageData && order.designImageData.startsWith("data:image")) {
    try {
      const base64Data = order.designImageData.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
      const filePath = import_path.default.join(UPLOADS_DIR, fileName);
      import_fs.default.writeFileSync(filePath, imageBuffer);
      console.log(`[Uploads] Saved design image to disk: ${filePath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
      if (baseUrl) {
        downloadUrl = `${baseUrl}/uploads/${fileName}`;
      }
    } catch (saveErr) {
      console.error("[Uploads Error] Could not save design image:", saveErr);
    }
  }
  const hasAttachment = Boolean(imageBuffer);
  const { subject, html, text } = generateOrderEmailHtml(order, hasAttachment, fileName, downloadUrl);
  const targetEmailStr = TARGET_EMAILS.join(", ");
  try {
    const transporter = import_nodemailer.default.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass
      }
    });
    const mailOptions = {
      from: `"Photobook Vietnam" <${SMTP_CONFIG.user}>`,
      to: TARGET_EMAILS,
      replyTo: order.customerEmail || void 0,
      subject,
      text,
      html
    };
    if (imageBuffer) {
      mailOptions.attachments = [
        {
          filename: fileName,
          content: imageBuffer,
          cid: "designImagePreview"
        }
      ];
    }
    const info = await transporter.sendMail(mailOptions);
    console.log("[SMTP Gmail Success] Order email sent with optimized image file! MessageId:", info.messageId);
    return {
      success: true,
      targetEmail: targetEmailStr,
      fileName: hasAttachment ? fileName : void 0,
      downloadUrl
    };
  } catch (err) {
    console.error("[SMTP Gmail Error]", err);
    return { success: false, targetEmail: targetEmailStr, error: err.message };
  }
}
function detectImageAspectRatioFromBuffer(buffer) {
  let width = 0;
  let height = 0;
  if (buffer && buffer.length >= 24) {
    if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    } else if (buffer[0] === 255 && buffer[1] === 216) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 255) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
          if (offset + 8 < buffer.length) {
            height = buffer.readUInt16BE(offset + 5);
            width = buffer.readUInt16BE(offset + 7);
          }
          break;
        }
        if (marker === 217 || marker === 218) break;
        if (offset + 4 > buffer.length) break;
        const len = buffer.readUInt16BE(offset + 2);
        offset += 2 + len;
      }
    }
  }
  if (!width || !height) return "3:4";
  const ratio = width / height;
  const candidates = [
    { key: "9:16", val: 9 / 16 },
    { key: "3:4", val: 3 / 4 },
    { key: "1:1", val: 1 },
    { key: "4:3", val: 4 / 3 },
    { key: "16:9", val: 16 / 9 }
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
var LIGHTING_RESTORATION_PROMPT = `ROLE:
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
function createExpressApp() {
  const app2 = (0, import_express.default)();
  app2.use((req, _res, next) => {
    if (req.body !== void 0 && req.body !== null) {
      req._body = true;
    }
    const matchedPath = req.headers["x-matched-path"];
    if (matchedPath && typeof matchedPath === "string" && matchedPath.startsWith("/api")) {
      req.url = matchedPath;
    }
    next();
  });
  app2.use(import_express.default.json({ limit: "100mb" }));
  app2.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
  app2.use("/uploads", import_express.default.static(UPLOADS_DIR));
  app2.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = import_path.default.join(UPLOADS_DIR, filename);
    if (import_fs.default.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send("File kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n l\u01B0u tr\u1EEF.");
    }
  });
  const apiRouter = import_express.default.Router();
  apiRouter.get(["/health", "/healthz"], (req, res) => {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
    res.json({
      status: "ok",
      geminiConfigured: Boolean(geminiKey),
      geminiKeyLength: geminiKey.length,
      nodeVersion: process.version,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.VERCEL ? "vercel" : "local",
      supportedRoutes: [
        "/api/health",
        "/api/order/submit",
        "/api/payos/create-payment",
        "/api/payos/check-status/:orderCode",
        "/api/payos/webhook",
        "/api/ai/replace-background",
        "/api/ai/restore-lighting"
      ]
    });
  });
  apiRouter.post(["/order/submit", "/submit"], async (req, res) => {
    try {
      const order = req.body;
      if (!order.groomName || !order.brideName) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu th\xF4ng tin t\xEAn D\xE2u R\u1EC3 b\u1EAFt bu\u1ED9c." });
      }
      console.log(`[Order Received] ${order.groomName} & ${order.brideName} | Phone: ${order.customerPhone}`);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const baseUrl = `${protocol}://${host}`;
      const emailResult = await sendOrderEmail(order, baseUrl);
      return res.json({
        success: true,
        message: "\u0110\u01A1n \u0111\u1EB7t in \u1EA3nh c\u1ED5ng c\u01B0\u1EDBi \u0111\xE3 \u0111\u01B0\u1EE3c ti\u1EBFp nh\u1EADn th\xE0nh c\xF4ng!",
        emailSent: emailResult.success,
        targetEmail: emailResult.targetEmail,
        fileName: emailResult.fileName,
        downloadUrl: emailResult.downloadUrl
      });
    } catch (err) {
      console.error("[Order Processing Error]", err);
      return res.status(500).json({ success: false, error: err.message || "L\u1ED7i x\u1EED l\xFD \u0111\u01A1n \u0111\u1EB7t in." });
    }
  });
  apiRouter.post(["/payos/create-payment", "/create-payment"], async (req, res) => {
    try {
      const {
        amount,
        amountVnd,
        packageName,
        creditsAmount,
        userId,
        userEmail,
        returnUrl,
        cancelUrl
      } = req.body || {};
      const finalAmount = Math.round(Number(amount || amountVnd));
      const finalCredits = Number(creditsAmount) || 10;
      if (!finalAmount || !userId) {
        return res.status(400).json({
          success: false,
          error: "Thi\u1EBFu th\xF4ng tin thanh to\xE1n (amount/amountVnd, userId)."
        });
      }
      const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100));
      const description = `PBVN ${finalCredits}luot`.slice(0, 25);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const fallbackReturn = `${protocol}://${host}/?payment_status=success&orderCode=${orderCode}`;
      const fallbackCancel = `${protocol}://${host}/?payment_status=cancelled&orderCode=${orderCode}`;
      const paymentData = {
        orderCode,
        amount: finalAmount,
        description,
        returnUrl: returnUrl || fallbackReturn,
        cancelUrl: cancelUrl || fallbackCancel
      };
      console.log(`[PayOS] Creating payment link for order ${orderCode}:`, paymentData);
      let paymentLinkResponse;
      if (payos.paymentRequests && typeof payos.paymentRequests.create === "function") {
        paymentLinkResponse = await payos.paymentRequests.create(paymentData);
      } else if (typeof payos.createPaymentLink === "function") {
        paymentLinkResponse = await payos.createPaymentLink(paymentData);
      } else {
        throw new Error("PayOS SDK method not available");
      }
      const orderRecord = {
        orderCode,
        userId,
        userEmail: userEmail || "",
        packageName: packageName || `${finalCredits} l\u01B0\u1EE3t AI`,
        creditsAmount: finalCredits,
        amountVnd: finalAmount,
        status: "PENDING",
        createdAt: Date.now(),
        checkoutUrl: paymentLinkResponse.checkoutUrl,
        qrCode: paymentLinkResponse.qrCode,
        accountNumber: paymentLinkResponse.accountNumber,
        accountName: paymentLinkResponse.accountName,
        bin: paymentLinkResponse.bin,
        description
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
        description: paymentLinkResponse.description || description,
        credits: finalCredits,
        packageName: packageName || `${finalCredits} l\u01B0\u1EE3t AI`
      });
    } catch (err) {
      console.error("[PayOS Create Payment Error]", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Kh\xF4ng th\u1EC3 t\u1EA1o m\xE3 thanh to\xE1n VietQR qua PayOS."
      });
    }
  });
  apiRouter.get(["/payos/check-status/:orderCode", "/check-status/:orderCode"], async (req, res) => {
    try {
      const orderCode = Number(req.params.orderCode);
      if (!orderCode) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu m\xE3 \u0111\u01A1n h\xE0ng orderCode." });
      }
      const cached = payosOrdersCache.get(orderCode);
      try {
        let paymentInfo;
        if (payos.paymentRequests && typeof payos.paymentRequests.get === "function") {
          paymentInfo = await payos.paymentRequests.get(orderCode);
        } else if (typeof payos.getPaymentLinkInformation === "function") {
          paymentInfo = await payos.getPaymentLinkInformation(orderCode);
        } else {
          throw new Error("PayOS SDK get info method not available");
        }
        console.log(`[PayOS Check Status] Order ${orderCode} status: ${paymentInfo.status}`);
        let normalizedStatus = "PENDING";
        if (paymentInfo.status === "PAID") {
          normalizedStatus = "PAID";
        } else if (paymentInfo.status === "CANCELLED" || paymentInfo.status === "EXPIRED") {
          normalizedStatus = "CANCELLED";
        }
        if (cached) {
          cached.status = normalizedStatus;
          if (normalizedStatus === "PAID" && !cached.paidAt) {
            cached.paidAt = Date.now();
          }
          payosOrdersCache.set(orderCode, cached);
        }
        return res.json({
          success: true,
          orderCode,
          status: normalizedStatus,
          isPaid: normalizedStatus === "PAID",
          creditsAmount: cached?.creditsAmount || 0,
          userId: cached?.userId || "",
          amount: paymentInfo.amount,
          rawStatus: paymentInfo.status
        });
      } catch (payosErr) {
        if (cached) {
          return res.json({
            success: true,
            orderCode,
            status: cached.status,
            isPaid: cached.status === "PAID",
            creditsAmount: cached.creditsAmount,
            userId: cached.userId,
            amount: cached.amountVnd
          });
        }
        throw payosErr;
      }
    } catch (err) {
      console.error("[PayOS Check Status Error]", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Kh\xF4ng th\u1EC3 ki\u1EC3m tra tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng PayOS."
      });
    }
  });
  apiRouter.post(["/payos/webhook", "/webhook"], async (req, res) => {
    try {
      const webhookBody = req.body;
      console.log("[PayOS Webhook Received]", JSON.stringify(webhookBody));
      let webhookData;
      if (payos.webhooks && typeof payos.webhooks.verify === "function") {
        webhookData = payos.webhooks.verify(webhookBody);
      } else if (typeof payos.verifyPaymentWebhookData === "function") {
        webhookData = payos.verifyPaymentWebhookData(webhookBody);
      } else {
        webhookData = webhookBody?.data || webhookBody;
      }
      const data = webhookData || webhookBody?.data || webhookBody;
      const orderCode = Number(data?.orderCode);
      const isSuccess = data.code === "00" || webhookData?.code === "00" || data.status === "PAID" || webhookData?.status === "PAID" || webhookData?.desc === "success" || data.desc === "success";
      if (orderCode && isSuccess) {
        const order = payosOrdersCache.get(orderCode);
        if (order) {
          order.status = "PAID";
          order.paidAt = Date.now();
          payosOrdersCache.set(orderCode, order);
          console.log(`[PayOS Webhook] Order ${orderCode} verified as PAID for user ${order.userId} (+${order.creditsAmount} credits)`);
        }
      }
      return res.json({ success: true, message: "Webhook processed" });
    } catch (err) {
      console.error("[PayOS Webhook Error]", err);
      return res.status(200).json({ success: false, error: err?.message });
    }
  });
  apiRouter.post(["/ai/replace-background", "/replace-background"], async (req, res) => {
    try {
      const {
        image,
        prompt,
        themeTitle,
        themePrompt,
        customPrompt,
        templateName,
        preserveFraming,
        aspectRatio,
        imageSize = "1K"
      } = req.body || {};
      if (!image) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu d\u1EEF li\u1EC7u h\xECnh \u1EA3nh (image)." });
      }
      let mimeType = "image/jpeg";
      let base64Data = "";
      if (image.startsWith("data:image")) {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        }
      } else if (image.startsWith("http://") || image.startsWith("https://")) {
        const imgRes = await fetch(image);
        if (!imgRes.ok) {
          throw new Error(`Kh\xF4ng th\u1EC3 t\u1EA3i \u1EA3nh ngu\u1ED3n: HTTP ${imgRes.status}`);
        }
        const arrayBuf = await imgRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        base64Data = buf.toString("base64");
      } else {
        base64Data = image;
      }
      let cleanMime = (mimeType || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(cleanMime)) {
        cleanMime = "image/jpeg";
      }
      mimeType = cleanMime;
      const rawImageBuffer = Buffer.from(base64Data, "base64");
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);
      let validAspectRatio = detectedRatio;
      if (aspectRatio && ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio)) {
        validAspectRatio = aspectRatio;
      }
      let validImageSize = "1K";
      if (["1K", "2K", "4K"].includes(imageSize)) {
        validImageSize = imageSize;
      }
      console.log(`[AI Background Replacement] Starting generation with size: ${validImageSize}, aspect: ${validAspectRatio} (detected: ${detectedRatio})`);
      const chosenTheme = templateName || themeTitle || "Phong C\xE1ch \u0110\xE1m C\u01B0\u1EDBi Sang Tr\u1ECDng";
      const promptDetails = prompt || customPrompt || themePrompt || "A luxurious, elegant high-end wedding venue with soft cinematic warm lighting, romantic floral decorations, bokeh background, maintaining photographic realism.";
      const apiKey = (req.headers["x-gemini-api-key"] || req.body?.apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "Ch\u01B0a c\u1EA5u h\xECnh GEMINI_API_KEY tr\xEAn Vercel/h\u1EC7 th\u1ED1ng.",
          message: "Ch\u01B0a t\xECm th\u1EA5y bi\u1EBFn m\xF4i tr\u01B0\u1EDDng GEMINI_API_KEY. Vui l\xF2ng th\xEAm bi\u1EBFn m\xF4i tr\u01B0\u1EDDng n\xE0y tr\xEAn trang qu\u1EA3n l\xFD Vercel Project Settings > Environment Variables, sau \u0111\xF3 redeploy."
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      let finalPrompt = (prompt || customPrompt || themePrompt || "").trim();
      if (!finalPrompt || finalPrompt.length < 20) {
        finalPrompt = `Professional Wedding Photo Retouching & Background Replacement:
Keep the bride and groom exactly as they are in the original photo: preserve their faces, identities, expressions, hairstyles, poses, wedding outfits, flowers, and natural skin tones completely intact and razor sharp.
Seamlessly replace ONLY the background with a stunning new environment:
Theme: "${chosenTheme}".
Details: "${promptDetails}".
Ensure natural lighting integration, matching color temperature, realistic shadows on the subjects, depth of field, and perfect edge blending around hair and veil. The final result must look like a high-end luxury editorial wedding photograph.`;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            {
              text: finalPrompt
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio,
            imageSize: validImageSize
          }
        }
      });
      let generatedImageUrl = null;
      let generatedText = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgMime = part.inlineData.mimeType || "image/png";
          generatedImageUrl = `data:${imgMime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          generatedText = part.text;
        }
      }
      if (!generatedImageUrl) {
        return res.status(500).json({
          success: false,
          error: generatedText || "AI kh\xF4ng th\u1EC3 t\u1EA1o \u0111\u01B0\u1EE3c h\xECnh \u1EA3nh thay n\u1EC1n. Vui l\xF2ng th\u1EED l\u1EA1i v\u1EDBi \u1EA3nh ho\u1EB7c g\xF3c ch\u1EE5p kh\xE1c."
        });
      }
      const aiFileName = `ai_bg_${Date.now()}.png`;
      const aiFilePath = import_path.default.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
        import_fs.default.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn("[AI Storage] Could not persist generated file to disk:", writeErr);
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;
      let cloudinaryUrl = null;
      try {
        const clientUserId = req.body?.userId || req.body?.userEmail || "";
        cloudinaryUrl = await uploadRenderToCloudinary(generatedImageUrl, {
          userId: clientUserId,
          templateName: chosenTheme,
          resolution: validImageSize
        });
      } catch (cErr) {
        console.warn("[Cloudinary non-blocking upload error in Express]:", cErr);
      }
      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        cloudinaryUrl: cloudinaryUrl || staticUrl,
        staticUrl: cloudinaryUrl || staticUrl,
        fileName: aiFileName,
        theme: chosenTheme,
        resolution: validImageSize
      });
    } catch (err) {
      console.error("[AI Replace Background Error]", err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("429");
      const isSuspended = errMsg.includes("CONSUMER_SUSPENDED") || errMsg.includes("suspended");
      const isKeyInvalid = errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT") && errMsg.includes("key");
      let userFriendlyMessage = `L\u1ED7i x\u1EED l\xFD AI: ${errMsg}`;
      if (isKeyInvalid) {
        userFriendlyMessage = "Kh\xF3a GEMINI_API_KEY kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i API Key tr\xEAn Google AI Studio.";
      } else if (isSuspended) {
        userFriendlyMessage = "Kh\xF3a API Google Cloud c\u1EE7a d\u1EF1 \xE1n \u0111ang b\u1ECB t\u1EA1m d\u1EEBng (CONSUMER_SUSPENDED). Vui l\xF2ng ki\u1EC3m tra tr\u1EA1ng th\xE1i thanh to\xE1n tr\xEAn Google Cloud Console.";
      } else if (isQuotaError) {
        userFriendlyMessage = "H\u1EC7 th\u1ED1ng \u0111\xE3 \u0111\u1EA1t gi\u1EDBi h\u1EA1n y\xEAu c\u1EA7u AI (429 Quota limit). T\xEDnh n\u0103ng thay n\u1EC1n AI c\u1EA7n k\xEDch ho\u1EA1t g\xF3i t\xE0i nguy\xEAn Google Cloud (Paid API Key). Vui l\xF2ng c\u1EA5u h\xECnh thanh to\xE1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c s\u1EED d\u1EE5ng kh\xF4ng gi\u1EDBi h\u1EA1n.";
      }
      return res.status(500).json({
        success: false,
        error: errMsg,
        isQuotaError,
        isSuspended,
        message: userFriendlyMessage
      });
    }
  });
  apiRouter.post(["/ai/restore-lighting", "/restore-lighting"], async (req, res) => {
    try {
      const {
        image,
        prompt,
        aspectRatio,
        imageSize = "1K"
      } = req.body || {};
      if (!image) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu d\u1EEF li\u1EC7u h\xECnh \u1EA3nh (image)." });
      }
      let mimeType = "image/jpeg";
      let base64Data = "";
      if (image.startsWith("data:image")) {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        }
      } else if (image.startsWith("http://") || image.startsWith("https://")) {
        const imgRes = await fetch(image);
        if (!imgRes.ok) {
          throw new Error(`Kh\xF4ng th\u1EC3 t\u1EA3i \u1EA3nh ngu\u1ED3n: HTTP ${imgRes.status}`);
        }
        const arrayBuf = await imgRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        base64Data = buf.toString("base64");
      } else {
        base64Data = image;
      }
      let cleanMime = (mimeType || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(cleanMime)) {
        cleanMime = "image/jpeg";
      }
      mimeType = cleanMime;
      const rawImageBuffer = Buffer.from(base64Data, "base64");
      const detectedRatio = detectImageAspectRatioFromBuffer(rawImageBuffer);
      let validAspectRatio = detectedRatio;
      if (aspectRatio && ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio)) {
        validAspectRatio = aspectRatio;
      }
      let validImageSize = "1K";
      if (["1K", "2K", "4K"].includes(imageSize)) {
        validImageSize = imageSize;
      }
      console.log(`[AI Lighting Restoration] Starting lighting restoration, size: ${validImageSize}, aspect: ${validAspectRatio} (detected: ${detectedRatio})`);
      const apiKey = (req.headers["x-gemini-api-key"] || req.body?.apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "Ch\u01B0a c\u1EA5u h\xECnh GEMINI_API_KEY tr\xEAn Vercel/h\u1EC7 th\u1ED1ng.",
          message: "Ch\u01B0a t\xECm th\u1EA5y bi\u1EBFn m\xF4i tr\u01B0\u1EDDng GEMINI_API_KEY. N\u1EBFu b\u1EA1n v\u1EEBa th\xEAm tr\xEAn Vercel, vui l\xF2ng v\xE0o tab Deployments > nh\u1EA5n n\xFAt ... > ch\u1ECDn Redeploy \u0111\u1EC3 Vercel n\u1EA1p bi\u1EBFn m\xF4i tr\u01B0\u1EDDng m\u1EDBi."
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const restorationPrompt = prompt && typeof prompt === "string" && prompt.trim().length > 0 ? prompt.trim() : LIGHTING_RESTORATION_PROMPT;
      console.log(`[AI Lighting Restoration] Calling Gemini model with prompt length ${restorationPrompt.length}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            {
              text: restorationPrompt
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio,
            imageSize: validImageSize
          }
        }
      });
      let generatedImageUrl = null;
      let generatedText = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imgMime = part.inlineData.mimeType || "image/png";
          generatedImageUrl = `data:${imgMime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          generatedText = part.text;
        }
      }
      if (!generatedImageUrl) {
        console.warn("[AI Lighting Restoration] Model returned no image part. Text:", generatedText);
        return res.status(500).json({
          success: false,
          error: generatedText || "AI kh\xF4ng th\u1EC3 t\u1EA1o \u0111\u01B0\u1EE3c h\xECnh \u1EA3nh c\u1EE9u s\xE1ng. Vui l\xF2ng th\u1EED l\u1EA1i."
        });
      }
      const aiFileName = `ai_lighting_${Date.now()}.png`;
      const aiFilePath = import_path.default.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
        import_fs.default.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn("[AI Lighting Storage] Could not persist generated file to disk:", writeErr);
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;
      let cloudinaryUrl = null;
      try {
        cloudinaryUrl = await uploadRenderToCloudinary(generatedImageUrl, {
          userId: req.body?.userId || req.headers["x-user-id"] || "anonymous",
          templateName: "cuu_sang_lighting_restore",
          resolution: validImageSize
        });
      } catch (cErr) {
        console.warn("[Cloudinary Error]", cErr);
      }
      console.log(`[AI Lighting Restoration] Success! Restored image saved to ${aiFilePath}. Cloudinary: ${cloudinaryUrl || "N/A"}`);
      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        cloudinaryUrl: cloudinaryUrl || staticUrl,
        staticUrl: cloudinaryUrl || staticUrl,
        fileName: aiFileName,
        resolution: validImageSize
      });
    } catch (err) {
      console.error("[AI Lighting Restoration Error]", err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("429");
      const isSuspended = errMsg.includes("CONSUMER_SUSPENDED") || errMsg.includes("suspended");
      const isKeyInvalid = errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT") && errMsg.includes("key");
      let userFriendlyMessage = `L\u1ED7i x\u1EED l\xFD c\u1EE9u s\xE1ng AI: ${errMsg}`;
      if (isKeyInvalid) {
        userFriendlyMessage = "Kh\xF3a GEMINI_API_KEY kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i API Key tr\xEAn Google AI Studio.";
      } else if (isSuspended) {
        userFriendlyMessage = "Kh\xF3a API Google Cloud c\u1EE7a d\u1EF1 \xE1n \u0111ang b\u1ECB t\u1EA1m d\u1EEBng (CONSUMER_SUSPENDED). Vui l\xF2ng ki\u1EC3m tra tr\u1EA1ng th\xE1i thanh to\xE1n tr\xEAn Google Cloud Console.";
      } else if (isQuotaError) {
        userFriendlyMessage = "H\u1EC7 th\u1ED1ng \u0111\xE3 \u0111\u1EA1t gi\u1EDBi h\u1EA1n y\xEAu c\u1EA7u AI (429 Quota limit). Vui l\xF2ng \u0111\u1EE3i 1 ph\xFAt v\xE0 th\u1EED l\u1EA1i.";
      }
      return res.status(500).json({
        success: false,
        error: errMsg,
        message: userFriendlyMessage
      });
    }
  });
  app2.use("/api", apiRouter);
  app2.use(apiRouter);
  return app2;
}
var app = createExpressApp();

// server.ts
import_dotenv2.default.config();
async function startServer() {
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
var isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME
);
if (!isServerless) {
  startServer();
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
