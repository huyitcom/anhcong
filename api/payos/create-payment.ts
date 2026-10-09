import app from '../../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    if (!req.url || req.url === '/' || req.url === '') {
      req.url = '/api/payos/create-payment';
    }
    app(req, res);
  });
}
