import Redis from 'ioredis';
import { ENV } from './env';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('student-redis');
export let redisClient: Redis;

export function connectRedis(): void {
  redisClient = new Redis(ENV.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: times => Math.min(times * 200, 5000),
    enableOfflineQueue: true,
    lazyConnect: false,
  });
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', err => logger.error('Redis error', { error: err.message }));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
}
