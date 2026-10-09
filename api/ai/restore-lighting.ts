import app from '../../server';

export default function handler(req: any, res: any) {
  if (!req.url || req.url === '/' || req.url === '') {
    req.url = '/api/ai/restore-lighting';
  }
  return app(req, res);
}
