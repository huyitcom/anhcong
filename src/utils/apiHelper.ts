/**
 * Safe API response parser that handles HTML error pages from Vercel / proxies
 * instead of throwing cryptic "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" errors.
 */
export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  
  try {
    return JSON.parse(text) as T;
  } catch (_err) {
    // If not JSON, analyze what server returned (usually HTML 404/413/502/504)
    if (response.status === 413 || text.includes('PAYLOAD_TOO_LARGE') || text.includes('Payload Too Large')) {
      throw new Error(
        'Ảnh gửi lên vượt quá giới hạn dung lượng tải lên của Vercel (4.5MB). Hệ thống đã tự động nén ảnh cho lần sau, vui lòng thử lại.'
      );
    }

    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('Vercel')) {
      if (response.status === 404) {
        throw new Error(
          'Máy chủ API chưa được cấu hình hoặc đường dẫn không tồn tại (404 Not Found). Khi deploy lên Vercel, vui lòng kiểm tra thư mục api/ và file cấu hình vercel.json.'
        );
      }
      if (response.status === 504 || response.status === 502) {
        throw new Error(
          'Yêu cầu xử lý AI bị quá thời gian giới hạn (Timeout / 504 Gateway Timeout). Gemini cần 10-25 giây để tạo ảnh. File vercel.json đã được cấu hình maxDuration: 60s để khắc phục vấn đề này.'
        );
      }
      throw new Error(`Máy chủ trả về phản hồi HTML lỗi (Mã ${response.status}). Vui lòng kiểm tra tab Logs trên Vercel.`);
    }

    throw new Error(text.trim() || `Lỗi máy chủ với mã phản hồi ${response.status}`);
  }
}

/**
 * Optimizes/compresses high-resolution image data URLs before sending to AI endpoints.
 * This ensures the request body NEVER exceeds Vercel Serverless Function's 4.5MB payload limit,
 * while preserving high fidelity for Gemini vision/generation models.
 */
export async function compressImageForAi(
  imageUri: string,
  maxDimension: number = 2048,
  quality: number = 0.88
): Promise<string> {
  if (!imageUri || !imageUri.startsWith('data:image')) {
    return imageUri;
  }
  // If base64 length is already small (< 1.5MB), no need to recompress
  if (imageUri.length < 1.5 * 1024 * 1024) {
    return imageUri;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUri);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}
