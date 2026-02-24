import { AppRequest, AppResponse, Next } from '../shared-local/http';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('http');

export function requestLogger(req: AppRequest, res: AppResponse, next: Next): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(`${req.method} ${req.url}`, {
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      correlationId: req.correlationId,
    });
  });
  next();
}
