import app from '../../server';

export default function handler(req: any, res: any) {
  if (!req.url || req.url === '/' || req.url === '') {
    req.url = '/api/order/submit';
  }
  return app(req, res);
}
