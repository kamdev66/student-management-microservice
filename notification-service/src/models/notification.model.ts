import mongoose, { Document, Schema } from 'mongoose';
export enum NotificationStatus { PENDING = 'pending', SENT = 'sent', FAILED = 'failed' }
export enum NotificationType { EMAIL = 'email' }
export interface INotification extends Document {
  type: NotificationType; recipient: string; subject: string; body: string;
  status: NotificationStatus; eventType: string; correlationId: string;
  retryCount: number; error?: string; sentAt?: Date;
  createdAt: Date; updatedAt: Date;
}
const schema = new Schema<INotification>({
  type: { type: String, enum: Object.values(NotificationType), default: NotificationType.EMAIL },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.PENDING },
  eventType: { type: String, required: true },
  correlationId: { type: String, required: true },
  retryCount: { type: Number, default: 0 },
  error: String, sentAt: Date,
}, { timestamps: true });
schema.index({ status: 1 });
schema.index({ createdAt: -1 });
export const Notification = mongoose.model<INotification>('Notification', schema);
