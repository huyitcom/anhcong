export default function handler(_req: any, res: any) {
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  res.status(200).json({
    status: 'ok',
    geminiConfigured: Boolean(geminiKey),
    geminiKeyLength: geminiKey.length,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local',
  });
}
