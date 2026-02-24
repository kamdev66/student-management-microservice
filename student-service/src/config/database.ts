import mongoose from 'mongoose';
import { ENV } from './env';
import { createLogger } from '../shared-local/logger';
const logger = createLogger('student-db');

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', err => logger.error('MongoDB error', { error: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  await mongoose.connect(ENV.MONGO_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
}
