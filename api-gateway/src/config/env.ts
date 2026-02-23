import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTH_SERVICE_URL:         process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  STUDENT_SERVICE_URL:      process.env.STUDENT_SERVICE_URL || 'http://localhost:3002',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  JWT_SECRET:       process.env.JWT_SECRET || 'dev_jwt_secret_min_32_chars_here!!',
  REDIS_URL:        process.env.REDIS_URL || 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX:       parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  AUTH_RATE_LIMIT_MAX:  parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
} as const;
