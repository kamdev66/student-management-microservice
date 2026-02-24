import { AppRequest, AppResponse, Next } from '../shared-local/http';
import { TooManyRequestsError } from '../shared-local/errors';

interface RateLimitRecord { count: number; resetAt: number }
const store = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (rec.resetAt < now) store.delete(key);
  }
}, 60_000).unref();

export function rateLimit(windowMs: number, max: number) {
  return (req: AppRequest, res: AppResponse, next: Next): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown';
    const now = Date.now();

    let rec = store.get(ip);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + windowMs };
      store.set(ip, rec);
    }
    rec.count++;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - rec.count)));
    res.setHeader('X-RateLimit-Reset', new Date(rec.resetAt).toISOString());

    if (rec.count > max) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
       next(new TooManyRequestsError('Too many requests — please slow down'));
    }
    next();
  };
}
