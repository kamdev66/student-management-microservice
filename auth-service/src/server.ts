import 'dotenv/config';
import http from 'http';
import { Application, Router } from './shared-local/http';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import { createAuthRouter } from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { cors } from './middleware/cors.middleware';
import { securityHeaders } from './middleware/security.middleware';
import { swaggerSpec, swaggerUiHtml } from './utils/swagger';
import { ENV } from './config/env';
import { createLogger } from './shared-local/logger';

const logger = createLogger('auth-server');

async function bootstrap() {
  try {
    await connectDatabase();
    connectRedis();
    await connectRabbitMQ();

    const app = new Application();
    app.use(securityHeaders, cors, requestLogger);

    const healthRouter = new Router();
    healthRouter.get('/health', (_req, res, _next) => {
      res.json(200, {
        success: true, service: 'auth-service', status: 'healthy',
        timestamp: new Date().toISOString(), uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    });

    const docsRouter = new Router();
    docsRouter.get('/api-docs', (_req, res, _next) => {
      const html = swaggerUiHtml(JSON.stringify(swaggerSpec), 'Auth Service API');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
    docsRouter.get('/api-docs/spec', (_req, res, _next) => { res.json(200, swaggerSpec); });

    app.addRouter(healthRouter);
    app.addRouter(docsRouter);
    app.addRouter(createAuthRouter());
    app.onError(errorHandler);

    const server = http.createServer(app.handler());
    server.listen(ENV.PORT, () => {
      logger.info(`Auth Service running on port ${ENV.PORT}`);
      logger.info(`Swagger: http://localhost:${ENV.PORT}/api-docs`);
    });

    const shutdown = (sig: string) => {
      logger.info(`${sig} — shutting down`);
      server.close(() => { logger.info('Server closed'); process.exit(0); });
      setTimeout(() => process.exit(1), 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('uncaughtException', err => { logger.error('Uncaught', { error: err.message }); process.exit(1); });
    process.on('unhandledRejection', reason => { logger.error('Unhandled rejection', { reason: String(reason) }); });
  } catch (err) {
    createLogger('auth-server').error('Failed to start', { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap();
