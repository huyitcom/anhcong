import app from '../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    const matchedPath = req.headers?.['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    }
    app(req, res);
  });
}
