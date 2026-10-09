/**
 * Safe API response parser that handles HTML error pages from Vercel / proxies
 * instead of throwing cryptic "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" errors.
 */
export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  
  try {
    return JSON.parse(text) as T;
  } catch (_err) {
    // If not JSON, analyze what server returned (usually HTML 404/502/504)
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('Vercel')) {
      if (response.status === 404) {
        throw new Error(
          'Máy chủ API chưa được cấu hình hoặc đường dẫn không tồn tại (404 Not Found). Khi deploy lên Vercel, vui lòng đảm bảo file cấu hình vercel.json và Serverless Function api/index.ts đã được triển khai.'
        );
      }
      if (response.status === 504 || response.status === 502) {
        throw new Error(
          'Yêu cầu xử lý AI bị quá thời gian giới hạn (Timeout / 504 Gateway Timeout). Gemini cần 10-25 giây để tạo ảnh. Bạn nên nâng giới hạn maxDuration trên Vercel hoặc chuyển sang Render/Railway.'
        );
      }
      throw new Error(`Máy chủ trả về phản hồi HTML lỗi (Mã ${response.status}). Vui lòng kiểm tra nhật ký (Logs) trên Vercel.`);
    }

    throw new Error(text.trim() || `Lỗi máy chủ với mã phản hồi ${response.status}`);
  }
}
