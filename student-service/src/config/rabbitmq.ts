import amqplib from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from './env';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('student-rabbitmq');
const EXCHANGE = 'student_management';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    const conn = await amqplib.connect(ENV.RABBITMQ_URL);
    const ch = await conn.createChannel();

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    connection = conn;
    channel = ch;

    logger.info('RabbitMQ connected');

    conn.on('error', (err: Error) => {
      logger.error('RabbitMQ error', { error: err.message });
      setTimeout(connectRabbitMQ, 5000);
    });

    conn.on('close', () => {
      logger.warn('RabbitMQ closed, retrying...');
      setTimeout(connectRabbitMQ, 5000);
    });

  } catch (err) {
    logger.error('RabbitMQ connection failed, retrying in 5s', {
      error: (err as Error).message,
    });
    setTimeout(connectRabbitMQ, 5000);
  }
}

export async function publishEvent(
  routingKey: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!channel) {
    logger.warn(`No RabbitMQ channel, skipping event: ${routingKey}`);
    return;
  }

  const message = {
    eventType: routingKey,
    timestamp: new Date().toISOString(),
    correlationId: uuidv4(),
    payload,
  };

  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      contentType: 'application/json',
    }
  );

  logger.info(`Event published: ${routingKey}`);
}