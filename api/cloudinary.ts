import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'tq2yiygt';
const API_KEY = process.env.CLOUDINARY_API_KEY || '831334161118296';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'OCijUGp73Y8KI1W1sP7OxHbH8Bo';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export async function uploadRenderToCloudinary(
  base64OrUrl: string,
  options?: {
    userId?: string;
    templateName?: string;
    resolution?: string;
  }
): Promise<string | null> {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.warn('[Cloudinary] Missing credentials, skipping upload');
      return null;
    }

    const publicId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const result = await cloudinary.uploader.upload(base64OrUrl, {
      folder: 'ai-wedding-renders',
      public_id: publicId,
      resource_type: 'image',
      tags: ['ai_render', options?.templateName || 'wedding_bg'].filter(Boolean),
      context: {
        userId: options?.userId || '',
        template: options?.templateName || '',
        resolution: options?.resolution || '',
      },
    });

    console.log('[Cloudinary] Rendered image uploaded successfully:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary Upload Error]', error);
    return null;
  }
}

export default cloudinary;
