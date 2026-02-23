import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '3002', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27018/student_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_min_32_chars_here!!',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10),
} as const;
