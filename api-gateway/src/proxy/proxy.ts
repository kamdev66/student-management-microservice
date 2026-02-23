import http from 'http';
import https from 'https';
import { URL } from 'url';
import { AppRequest, AppResponse, Next } from '../../shared-local/http';
import { createLogger } from '../../shared-local/logger';

const logger = createLogger('gateway-proxy');

export function proxyTo(targetBase: string) {
  return (req: AppRequest, res: AppResponse, next: Next): void => {
    const target = new URL(req.url || '/', targetBase);
    const transport = target.protocol === 'https:' ? https : http;

    const options: http.RequestOptions = {
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + (target.search || ''),
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
        'x-forwarded-for': req.socket?.remoteAddress || '',
        'x-correlation-id': req.correlationId || '',
        'x-user-id':    req.user?.userId || '',
        'x-user-email': req.user?.email  || '',
        'x-user-role':  req.user?.role   || '',
      },
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      logger.error('Proxy error', { target: targetBase, error: err.message });
      if (!res.writableEnded) res.json(503, { success: false, message: 'Service temporarily unavailable' });
    });

    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy();
      if (!res.writableEnded) res.json(504, { success: false, message: 'Gateway timeout' });
    });

    if (req.body !== undefined && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      const bodyStr = JSON.stringify(req.body);
      proxyReq.setHeader('content-length', Buffer.byteLength(bodyStr));
      proxyReq.setHeader('content-type', 'application/json');
      proxyReq.write(bodyStr);
    }

    proxyReq.end();
  };
}
