import app from '../../../../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    const { orderCode } = req.query || {};
    if (orderCode) {
      req.url = `/api/payos/check-status/${orderCode}`;
    }
    app(req, res);
  });
}
