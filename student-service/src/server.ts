import 'dotenv/config';
import http from 'http';
import { Application, Router } from '../shared-local/http';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import { createStudentRouter } from './routes/student.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { cors } from './middleware/cors.middleware';
import { securityHeaders } from './middleware/security.middleware';
import { ENV } from './config/env';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('student-server');

async function bootstrap() {
  try {
    await connectDatabase();
    connectRedis();
    await connectRabbitMQ();

    const app = new Application();
    app.use(securityHeaders, cors, requestLogger);

    const healthRouter = new Router();
    healthRouter.get('/health', (_req, res, _next) => {
      res.json(200, { success: true, service: 'student-service', status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
    });

    app.addRouter(healthRouter);
    app.addRouter(createStudentRouter());
    app.onError(errorHandler);

    const server = http.createServer(app.handler());
    server.listen(ENV.PORT, () => { logger.info(`Student Service running on port ${ENV.PORT}`); });

    const shutdown = (sig: string) => { logger.info(sig); server.close(() => process.exit(0)); };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    createLogger('student-server').error('Failed to start', { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap();
