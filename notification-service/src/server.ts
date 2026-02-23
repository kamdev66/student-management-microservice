import 'dotenv/config';
import http from 'http';
import { Application, Router } from '../shared-local/http';
import { connectDatabase } from './config/database';
import { startConsumer } from './consumers/notification.consumer';
import { Notification } from './models/notification.model';
import { errorHandler } from './middleware/error.middleware';
import { cors } from './middleware/cors.middleware';
import { ENV } from './config/env';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('notification-server');

async function bootstrap() {
  try {
    await connectDatabase();
    await startConsumer();

    const app = new Application();
    app.use(cors);

    const router = new Router();
    router.get('/health', (_req, res, _next) => {
      res.json(200, { success: true, service: 'notification-service', status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
    });
    router.get('/api/v1/notifications', async (_req, res, next) => {
      try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
        res.json(200, { success: true, data: { notifications } });
      } catch (err) { next(err as Error); }
    });

    app.addRouter(router);
    app.onError(errorHandler);

    const server = http.createServer(app.handler());
    server.listen(ENV.PORT, () => logger.info(`Notification Service running on port ${ENV.PORT}`));

    const shutdown = (sig: string) => { logger.info(sig); server.close(() => process.exit(0)); };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start', { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap();
