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
  createExpressApp: () => createExpressApp,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_genai = require("@google/genai");
var import_node = require("@payos/node");

// src/data/lightingRestorationPrompt.ts
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

- all people
- identity
- facial features
- face shape
- facial expression
- eyes
- nose
- mouth
- hairstyle
- hairline
- skin texture
- skin tone
- body proportions
- body shape
- pose
- posture
- hands
- fingers
- wedding dress
- suit
- bouquet
- veil
- jewelry
- accessories
- clothing details
- original framing
- original composition
- original camera perspective
- original background
- original architectural elements

Do not redraw or reconstruct the people.

Do not change their appearance.

==================================================
2. RECOVER THE UNDEREXPOSED IMAGE
==================================================

The original photograph is significantly underexposed.

Carefully recover the dark areas while maintaining realistic photographic contrast.

Increase:

- overall exposure
- shadow detail
- midtone brightness
- facial visibility
- clothing detail
- background detail
- local illumination

Lift the shadows gradually and naturally.

Recover details from the dark suit without making it gray or washed out.

Reveal natural detail in the groom's black suit while keeping it genuinely black.

Brighten the bride's face and dress naturally without overexposing the white fabric.

Preserve highlight detail in the wedding dress.

Do NOT simply increase brightness globally.

Use intelligent tonal recovery similar to professional RAW photo development.

==================================================
3. FACE AND SKIN
==================================================

The faces are currently affected by low exposure.

Recover facial visibility naturally.

Make the faces clearly visible while preserving their exact original appearance.

Do NOT:

- change facial structure
- change facial expression
- enlarge eyes
- reshape nose
- reshape lips
- smooth the face excessively
- whiten the skin unnaturally
- change skin tone
- beautify the subjects
- make the subjects look younger
- create artificial makeup

Preserve realistic skin texture and natural skin imperfections.

The faces should look like the same people photographed with better exposure.

==================================================
4. WEDDING DRESS
==================================================

The wedding dress is white and contains important fabric folds and texture.

Recover the dress detail carefully.

Maintain:

- natural white color
- fabric texture
- folds
- shadows
- highlights
- original shape

Do NOT turn the dress into a flat pure-white area.

Do NOT clip the highlights.

The dress should retain subtle dimensionality and realistic fabric detail.

==================================================
5. GROOM'S DARK SUIT
==================================================

The groom's suit is very dark and currently contains crushed shadow areas.

Recover as much natural fabric detail as possible.

Maintain the suit as a deep black / very dark formal suit.

Do NOT turn the suit gray.

Do NOT invent patterns or textures that were not present.

Reveal subtle natural folds and tonal variation only where photographic information already exists.

==================================================
6. BACKGROUND
==================================================

KEEP THE ORIGINAL BACKGROUND EXACTLY.

Do not replace it.

Do not redesign it.

Do not remove it.

Do not add new objects.

Do not change the architecture.

Do not change the curtains.

Do not change the walls.

Do not change the room layout.

Only improve the exposure, shadow detail, color balance and overall image quality of the existing background.

The background should become naturally visible without looking artificially bright.

==================================================
7. LIGHTING CORRECTION
==================================================

Reconstruct the appearance of a properly exposed version of the ORIGINAL lighting.

Do not introduce a completely new lighting direction.

Do not make the scene look like it was photographed outdoors.

Do not turn the image into bright daylight.

Preserve the original indoor wedding atmosphere.

Create soft, natural, flattering illumination across the subjects.

Maintain realistic light falloff.

Keep the original relationship between light and shadow.

The result should feel like the photographer had used a properly exposed camera setting or gently lifted the exposure during RAW processing.

==================================================
8. COLOR CORRECTION
==================================================

Correct the color balance while preserving the original atmosphere.

Improve:

- white balance
- skin color
- neutral tones
- shadow color
- highlight color
- overall tonal consistency

Keep the wedding atmosphere elegant and natural.

Avoid excessive orange, yellow, green or magenta color casts.

The white wedding dress should remain naturally white.

Skin should remain natural and realistic.

==================================================
9. SHADOW RECOVERY
==================================================

Recover crushed blacks and blocked shadows selectively.

Prioritize shadow recovery around:

- faces
- hair
- groom's suit
- bride's dress folds
- hands
- bouquet
- lower clothing
- important background details

Do not eliminate all shadows.

The final photograph must still have dimensionality and depth.

Maintain realistic blacks and contrast.

==================================================
10. HIGHLIGHT PROTECTION
==================================================

Protect all existing bright areas.

Especially preserve detail in:

- wedding dress
- veil
- skin highlights
- bouquet
- bright wall areas

Do not create blown-out white regions.

Do not make the image excessively bright.

Use a balanced dynamic range.

==================================================
11. NO GENERATIVE RECONSTRUCTION
==================================================

This is extremely important.

DO NOT hallucinate or invent photographic details.

If a dark region contains insufficient information, recover it conservatively.

Do not invent:

- facial details
- hair details
- clothing patterns
- jewelry
- flowers
- architectural details
- objects
- textures

Do not replace missing information with AI-generated content.

The result must remain faithful to the original photograph.

==================================================
12. IMAGE QUALITY
==================================================

After exposure recovery, apply subtle professional photographic finishing:

- mild noise reduction
- subtle sharpening
- natural micro-contrast
- improved dynamic range
- clean tonal transitions
- realistic skin texture
- realistic fabric texture

Do NOT over-sharpen.

Do NOT create HDR halos.

Do NOT create plastic skin.

Do NOT create excessive clarity.

Do NOT make the photograph look like an AI-generated image.

==================================================
13. FINAL LOOK
==================================================

The final image should look like the SAME ORIGINAL WEDDING PHOTOGRAPH photographed with correct exposure.

It should feel like a professional photographer recovered the image from an underexposed RAW file.

The photograph should be:

- brighter
- clearer
- more readable
- naturally illuminated
- professionally color graded
- realistic
- elegant
- cinematic but natural

The original people and their appearance must remain unchanged.

The original background must remain unchanged.

Only exposure, tonal range, color balance and photographic quality should be improved.

==================================================
STRICT NEGATIVE CONSTRAINTS
==================================================

NO identity change.
NO face regeneration.
NO facial beautification.
NO body reshaping.
NO pose change.
NO clothing change.
NO bouquet change.
NO background replacement.
NO composition change.
NO camera angle change.
NO new objects.
NO new people.
NO invented details.
NO artificial skin.
NO excessive smoothing.
NO excessive sharpening.
NO HDR effect.
NO blown highlights.
NO crushed blacks.
NO gray-looking black suit.
NO overexposed wedding dress.
NO unnatural skin whitening.
NO daylight conversion.
NO dramatic new lighting.
NO cinematic relighting that changes the original scene.

OUTPUT:
A naturally restored, professionally exposed version of the original wedding photograph.

Preserve the original image exactly.
Improve ONLY exposure, shadow recovery, tonal balance, color correction and overall photographic quality.`;

// server.ts
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
  let fileName = `Anh_Cong_${groomSlug}_${brideSlug}_${Date.now()}.${ext}`;
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
          // used in <img src="cid:designImagePreview">
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
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      smtpUser: SMTP_CONFIG.user,
      targetEmails: TARGET_EMAILS,
      uploadsDir: UPLOADS_DIR,
      isServerless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  apiRouter.post(["/order/submit", "/submit"], async (req, res) => {
    const orderData = req.body;
    console.log("=== [NH\u1EACN \u0110\u01A0N \u0110\u1EB6T IN M\u1EDAI 300 DPI] === D\xE2u r\u1EC3:", orderData.groomName, orderData.brideName, "S\u0110T:", orderData.customerPhone);
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const emailResult = await sendOrderEmail(orderData, baseUrl);
    res.json({
      success: true,
      emailSent: emailResult.success,
      targetEmail: emailResult.targetEmail,
      fileName: emailResult.fileName,
      downloadUrl: emailResult.downloadUrl,
      error: emailResult.error,
      message: emailResult.success ? `\u0110\xE3 g\u1EEDi email th\xF4ng b\xE1o \u0111\u01A1n h\xE0ng k\xE8m file \u1EA3nh thi\u1EBFt k\u1EBF 300 DPI th\xE0nh c\xF4ng \u0111\u1EBFn: ${emailResult.targetEmail}` : "\u0110\xE3 l\u01B0u \u0111\u01A1n h\xE0ng v\xE0o h\u1EC7 th\u1ED1ng.",
      order: {
        groomName: orderData.groomName,
        brideName: orderData.brideName,
        customerPhone: orderData.customerPhone
      }
    });
  });
  apiRouter.post(["/payos/create-payment", "/create-payment"], async (req, res) => {
    try {
      const { userId, userEmail, packageName, creditsAmount, amountVnd } = req.body;
      if (!creditsAmount || !amountVnd) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu th\xF4ng tin g\xF3i n\u1EA1p (creditsAmount ho\u1EB7c amountVnd)." });
      }
      const timestampPart = Number(String(Date.now()).slice(-6));
      const randomPart = Math.floor(10 + Math.random() * 89);
      const orderCode = Number(`${timestampPart}${randomPart}`);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const baseUrl = `${protocol}://${host}`;
      const safeDesc = `NAP ${creditsAmount} LUOT AI`.slice(0, 25);
      const paymentData = {
        orderCode,
        amount: Math.round(Number(amountVnd)),
        description: safeDesc,
        returnUrl: `${baseUrl}/?payment=success&orderCode=${orderCode}`,
        cancelUrl: `${baseUrl}/?payment=cancel&orderCode=${orderCode}`
      };
      console.log(`[PayOS] Creating payment request for user ${userId || "anonymous"}, orderCode: ${orderCode}, amount: ${amountVnd}`);
      const paymentResult = await payos.paymentRequests.create(paymentData);
      const record = {
        orderCode,
        userId: userId || "anonymous",
        userEmail: userEmail || "",
        packageName: packageName || `${creditsAmount} L\u01B0\u1EE3t`,
        creditsAmount: Number(creditsAmount),
        amountVnd: Number(amountVnd),
        status: "PENDING",
        createdAt: Date.now(),
        checkoutUrl: paymentResult.checkoutUrl,
        qrCode: paymentResult.qrCode,
        accountNumber: paymentResult.accountNumber,
        accountName: paymentResult.accountName,
        bin: paymentResult.bin,
        description: paymentResult.description
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
        packageName
      });
    } catch (err) {
      console.error("[PayOS Error creating payment]", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Kh\xF4ng th\u1EC3 t\u1EA1o m\xE3 thanh to\xE1n PayOS"
      });
    }
  });
  apiRouter.get(["/payos/check-status/:orderCode", "/check-status/:orderCode"], async (req, res) => {
    try {
      const orderCode = Number(req.params.orderCode);
      if (!orderCode) {
        return res.status(400).json({ success: false, error: "M\xE3 \u0111\u01A1n kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const cachedOrder = payosOrdersCache.get(orderCode);
      if (cachedOrder && cachedOrder.status === "PAID") {
        return res.json({
          success: true,
          status: "PAID",
          isPaid: true,
          order: cachedOrder,
          creditsAmount: cachedOrder.creditsAmount
        });
      }
      const payosInfo = await payos.paymentRequests.get(orderCode);
      const isPaid = payosInfo.status === "PAID";
      if (isPaid && cachedOrder) {
        cachedOrder.status = "PAID";
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
          amountVnd: payosInfo.amount
        },
        creditsAmount: cachedOrder?.creditsAmount
      });
    } catch (err) {
      console.error("[PayOS Status Check Error]", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "L\u1ED7i ki\u1EC3m tra tr\u1EA1ng th\xE1i thanh to\xE1n"
      });
    }
  });
  apiRouter.post(["/payos/webhook", "/webhook"], async (req, res) => {
    try {
      const webhookData = req.body;
      console.log("[PayOS Webhook Received]:", JSON.stringify(webhookData));
      let verifiedData = null;
      try {
        verifiedData = await payos.webhooks.verify(webhookData);
      } catch (vErr) {
        console.warn("[PayOS Webhook Verification Warning]:", vErr);
      }
      const data = verifiedData || webhookData.data || webhookData;
      const orderCode = Number(data.orderCode);
      const isSuccess = webhookData.code === "00" || data.code === "00" || webhookData.desc === "success" || data.desc === "success";
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
      // 0.5625
      { key: "3:4", val: 3 / 4 },
      // 0.75
      { key: "1:1", val: 1 },
      // 1.0
      { key: "4:3", val: 4 / 3 },
      // 1.3333
      { key: "16:9", val: 16 / 9 }
      // 1.7778
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
  apiRouter.post(["/ai/replace-background", "/replace-background"], async (req, res) => {
    try {
      const {
        image,
        prompt,
        aspectRatio,
        templateName,
        imageSize = "2K",
        preserveFraming = true
      } = req.body || {};
      if (!image) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu d\u1EEF li\u1EC7u h\xECnh \u1EA3nh (image)." });
      }
      if (!prompt) {
        return res.status(400).json({ success: false, error: "Thi\u1EBFu c\xE2u l\u1EC7nh m\xF4 t\u1EA3 ph\xF4ng n\u1EC1n (prompt)." });
      }
      let validImageSize = "2K";
      if (["1K", "2K", "4K"].includes(imageSize)) {
        validImageSize = imageSize;
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
      console.log(`[AI Background] Starting replacement with template: ${templateName || "custom"}, size: ${validImageSize}, aspect: ${validAspectRatio}`);
      const apiKey = (req.headers["x-gemini-api-key"] || req.body?.apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "Ch\u01B0a c\u1EA5u h\xECnh GEMINI_API_KEY tr\xEAn Vercel/h\u1EC7 th\u1ED1ng.",
          message: "Ch\u01B0a t\xECm th\u1EA5y bi\u1EBFn m\xF4i tr\u01B0\u1EDDng GEMINI_API_KEY. N\u1EBFu b\u1EA1n v\u1EEBa th\xEAm tr\xEAn Vercel, vui l\xF2ng v\xE0o tab Deployments > nh\u1EA5n n\xFAt ... > ch\u1ECDn Redeploy \u0111\u1EC3 Vercel n\u1EA1p bi\u1EBFn m\xF4i tr\u01B0\u1EDDng m\u1EDBi."
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const masterPrompt = `
CRITICAL INSTRUCTIONS FOR PHOTO EDITING & IDENTITY PRESERVATION:
1. STRICT FACE & IDENTITY LOCK:
   - You MUST keep the EXACT original faces of both the bride and the groom 100% identical and unchanged.
   - Do NOT regenerate, reshape, swap, beautify, smooth out, or alter their eyes, eyebrows, nose, mouth, smile, teeth, jawline, skin tone, or hairstyle.
   - The facial features, expressions, and genuine facial likeness must remain perfectly true to the original people.

2. PRESERVE ORIGINAL FRAMING & SUBJECT SCALE:
   ${preserveFraming ? "- The couple in the input photo must remain in the foreground at their EXACT SAME SCALE, zoom level, and cropping. If the input image is a half-body / waist-up shot, DO NOT zoom out to show full-length feet or floor. Keep them in the medium close-up foreground. Position the background decorative elements (arch, doorway, florals) harmoniously BEHIND and AROUND them at their current scale." : "- Maintain natural realistic proportions for the couple without distorting or minimizing them."}

3. PRESERVE ATTIRE & ACCESSORIES:
   - Keep the bride's wedding dress, veil, jewelry, hairstyle, and bouquet intact.
   - Keep the groom's tuxedo/suit, bow tie/tie, and accessories intact.

4. SEAMLESS BACKGROUND COMPOSITING:
   - ONLY replace the background behind and around the couple with the specified scene below.
   - Seamlessly harmonize lighting, directional rim light, shadows, and subtle color reflections so the subjects look as though they were originally photographed in this new location.

TARGET BACKGROUND SCENE:
${prompt}
`.trim();
      console.log(`[AI Background] Calling Gemini model with size ${validImageSize} and prompt length ${masterPrompt.length}...`);
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
              text: masterPrompt
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
        console.warn("[AI Background] Model returned no image part. Text:", generatedText);
        return res.status(500).json({
          success: false,
          error: generatedText || "AI kh\xF4ng th\u1EC3 t\u1EA1o \u0111\u01B0\u1EE3c h\xECnh \u1EA3nh cho ph\xF4ng n\u1EC1n n\xE0y. Vui l\xF2ng th\u1EED l\u1EA1i v\u1EDBi m\u1EABu ph\xF4ng n\u1EC1n kh\xE1c."
        });
      }
      const aiFileName = `ai_bg_${Date.now()}.png`;
      const aiFilePath = import_path.default.join(UPLOADS_DIR, aiFileName);
      try {
        const imgBuffer = Buffer.from(generatedImageUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
        import_fs.default.writeFileSync(aiFilePath, imgBuffer);
      } catch (writeErr) {
        console.warn("[AI Background Storage] Could not persist generated file to disk:", writeErr);
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const staticUrl = `${protocol}://${host}/uploads/${aiFileName}`;
      console.log(`[AI Background] Success! Generated image saved to ${aiFilePath}`);
      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        staticUrl,
        fileName: aiFileName,
        resolution: validImageSize
      });
    } catch (err) {
      console.error("[AI Background Error]", err);
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("429");
      const isSuspended = errMsg.includes("CONSUMER_SUSPENDED") || errMsg.includes("suspended");
      let userFriendlyMessage = `L\u1ED7i x\u1EED l\xFD AI: ${errMsg}`;
      if (isSuspended) {
        userFriendlyMessage = "Kh\xF3a API Google Cloud c\u1EE7a d\u1EF1 \xE1n \u0111ang b\u1ECB t\u1EA1m d\u1EEBng (CONSUMER_SUSPENDED). B\u1EA1n vui l\xF2ng ki\u1EC3m tra tr\u1EA1ng th\xE1i t\xE0i kho\u1EA3n thanh to\xE1n tr\xEAn Google Cloud Console ho\u1EB7c ch\u1ECDn d\u1EF1 \xE1n kh\xE1c.";
      } else if (isQuotaError) {
        userFriendlyMessage = "T\xEDnh n\u0103ng Thay N\u1EC1n AI c\u1EA7n k\xEDch ho\u1EA1t g\xF3i t\xE0i nguy\xEAn Google Cloud (Paid API Key). Vui l\xF2ng c\u1EA5u h\xECnh thanh to\xE1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c s\u1EED d\u1EE5ng kh\xF4ng gi\u1EDBi h\u1EA1n.";
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
      console.log(`[AI Lighting Restoration] Success! Restored image saved to ${aiFilePath}`);
      return res.json({
        success: true,
        imageUrl: generatedImageUrl,
        staticUrl,
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
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
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
  app,
  createExpressApp
});
//# sourceMappingURL=server.cjs.map
