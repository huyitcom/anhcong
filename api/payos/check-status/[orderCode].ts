import app from '../../../../server';

export default function handler(req: any, res: any) {
  const { orderCode } = req.query || {};
  if (orderCode) {
    req.url = `/api/payos/check-status/${orderCode}`;
  }
  return app(req, res);
}
