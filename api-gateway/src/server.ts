import 'dotenv/config';
import http from 'http';
import { Application, Router } from './shared-local/http';
import { ENV } from './config/env';
import { proxyTo } from './proxy/proxy';
import { rateLimit } from './middleware/rateLimit.middleware';
import { authenticate } from './middleware/auth.middleware';
import { securityHeaders } from './middleware/security.middleware';
import { cors } from './middleware/cors.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { gatewaySwaggerSpec, swaggerHtml } from './utils/swagger';
import { createLogger } from './shared-local/logger';

const logger = createLogger('api-gateway');

const AUTH_URL    = ENV.AUTH_SERVICE_URL;
const STUDENT_URL = ENV.STUDENT_SERVICE_URL;
const NOTIF_URL   = ENV.NOTIFICATION_SERVICE_URL;

const globalLimiter = rateLimit(ENV.RATE_LIMIT_WINDOW_MS, ENV.RATE_LIMIT_MAX);
const authLimiter   = rateLimit(15 * 60 * 1000, ENV.AUTH_RATE_LIMIT_MAX);

const app = new Application();
app.use(securityHeaders, cors, requestLogger, globalLimiter);

// ─── Health ──────────────────────────────────────────────────────
const healthRouter = new Router();
healthRouter.get('/health', (_req, res, _next) => {
  res.json(200, {
    success: true, service: 'api-gateway', status: 'healthy',
    timestamp: new Date().toISOString(), uptime: process.uptime(),
    services: { auth: AUTH_URL, student: STUDENT_URL, notification: NOTIF_URL },
  });
});

// ─── Swagger ─────────────────────────────────────────────────────
const docsRouter = new Router();
docsRouter.get('/api-docs', (_req, res, _next) => {
  const html = swaggerHtml(gatewaySwaggerSpec, 'Student Management API');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});
docsRouter.get('/api-docs/spec', (_req, res, _next) => {
  res.json(200, gatewaySwaggerSpec);
});

// ─── Auth routes ─────────────────────────────────────────────────
const authPublicRouter = new Router();
authPublicRouter.post('/api/v1/auth/register', authLimiter, proxyTo(AUTH_URL));
authPublicRouter.post('/api/v1/auth/login',    authLimiter, proxyTo(AUTH_URL));
authPublicRouter.post('/api/v1/auth/refresh',  proxyTo(AUTH_URL));

const authProtectedRouter = new Router();
authProtectedRouter.post('/api/v1/auth/validate', proxyTo(AUTH_URL));
authProtectedRouter.post('/api/v1/auth/logout',     authenticate, proxyTo(AUTH_URL));
authProtectedRouter.post('/api/v1/auth/logout-all', authenticate, proxyTo(AUTH_URL));
authProtectedRouter.get('/api/v1/auth/profile',     authenticate, proxyTo(AUTH_URL));

// ─── Student routes ───────────────────────────────────────────────
const studentRouter = new Router();
studentRouter.get('/api/v1/students/stats', authenticate, proxyTo(STUDENT_URL));
studentRouter.get('/api/v1/students/all-student',       authenticate, proxyTo(STUDENT_URL));
studentRouter.get('/api/v1/students/:id',   authenticate, proxyTo(STUDENT_URL));
studentRouter.post('/api/v1/students/add-student',      authenticate, proxyTo(STUDENT_URL));
studentRouter.put('/api/v1/students/:id',   authenticate, proxyTo(STUDENT_URL));
studentRouter.delete('/api/v1/students/:id', authenticate, proxyTo(STUDENT_URL));

// ─── Notification routes ──────────────────────────────────────────
const notifRouter = new Router();
notifRouter.get('/api/v1/notifications', authenticate, proxyTo(NOTIF_URL));

app.addRouter(healthRouter);
app.addRouter(docsRouter);
app.addRouter(authPublicRouter);
app.addRouter(authProtectedRouter);
app.addRouter(studentRouter);
app.addRouter(notifRouter);
app.onError(errorHandler);

const server = http.createServer(app.handler());
server.listen(ENV.PORT, () => {
  logger.info(`API Gateway running on port ${ENV.PORT}`);
  logger.info(`Swagger: http://localhost:${ENV.PORT}/api-docs`);
  logger.info(`Health:  http://localhost:${ENV.PORT}/health`);
});

const shutdown = (sig: string) => {
  logger.info(`${sig} received — shutting down`);
  server.close(() => { logger.info('Server closed'); process.exit(0); });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', err => { logger.error('Uncaught', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', reason => { logger.error('Unhandled rejection', { reason: String(reason) }); });
