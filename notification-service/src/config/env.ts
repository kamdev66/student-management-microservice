import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
export const ENV = {
  PORT: parseInt(process.env.PORT || '3003', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27019/notification_db',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || 'noreply@example.com',
  SMTP_PASS: process.env.SMTP_PASS || '',
} as const;
