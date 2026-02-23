import amqplib from 'amqplib';
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { Notification, NotificationStatus, NotificationType } from '../models/notification.model';
import { emailService } from '../services/email.service';
import { createLogger } from '../../shared-local/logger';
import { ENV } from '../config/env';

const logger = createLogger('notification-consumer');
const EXCHANGE = 'student_management';
const QUEUE = 'notification_queue';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function startConsumer(): Promise<void> {
  try {
    const conn = await amqplib.connect(ENV.RABBITMQ_URL);
    const ch = await conn.createChannel();

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    const q = await ch.assertQueue(QUEUE, { durable: true });

    const keys = [
      'student.created',
      'student.deleted',
      'user.registered',
      'user.login',
    ];

    for (const key of keys) {
      await ch.bindQueue(q.queue, EXCHANGE, key);
    }

    await ch.prefetch(10);

    await ch.consume(QUEUE, (msg) => handleMessage(msg, ch), {
      noAck: false,
    });

    connection = conn;
    channel = ch;

    logger.info('RabbitMQ consumer started. Listening: ' + keys.join(', '));

    conn.on('close', () => {
      logger.warn('RabbitMQ closed, retrying...');
      setTimeout(startConsumer, 5000);
    });

    conn.on('error', (err: Error) => {
      logger.error('RabbitMQ error', { error: err.message });
      setTimeout(startConsumer, 5000);
    });

  } catch (err) {
    logger.error('Consumer start failed', {
      error: (err as Error).message,
    });
    setTimeout(startConsumer, 5000);
  }
}

async function handleMessage(
  msg: ConsumeMessage | null,
  ch: Channel
): Promise<void> {
  if (!msg) return;

  let notif: any = null;

  try {
    const event = JSON.parse(msg.content.toString());
    const { eventType, correlationId, payload } = event;

    logger.info('Processing event: ' + eventType, { correlationId });

    let emailOpts: any = null;

    if (eventType === 'user.registered') {
      emailOpts = emailService.welcome(payload.name, payload.email);
    } else if (eventType === 'student.created') {
      emailOpts = emailService.enrolled(
        payload.firstName + ' ' + payload.lastName,
        payload.enrollmentNumber,
        payload.email
      );
    } else if (eventType === 'student.deleted') {
      emailOpts = emailService.deleted(payload.email);
    }

    if (emailOpts) {
      notif = await Notification.create({
        type: NotificationType.EMAIL,
        recipient: emailOpts.to,
        subject: emailOpts.subject,
        body: emailOpts.text,
        eventType,
        correlationId,
        status: NotificationStatus.PENDING,
      });

      await emailService.send(emailOpts);

      notif.status = NotificationStatus.SENT;
      notif.sentAt = new Date();
      await notif.save();

      logger.info('Notification sent', {
        eventType,
        to: emailOpts.to,
      });
    }

    ch.ack(msg);

  } catch (err) {
    logger.error('Failed to process notification', {
      error: (err as Error).message,
    });

    if (notif) {
      notif.status = NotificationStatus.FAILED;
      notif.error = (err as Error).message;
      notif.retryCount++;
      await notif.save().catch(() => {});
    }

    const deathCount =
      (msg.properties.headers?.['x-death']?.[0]?.count as number) || 0;

    ch.nack(msg, false, deathCount < 3);
  }
}