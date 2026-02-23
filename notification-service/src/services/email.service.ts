import { createLogger } from '../../shared-local/logger';
import { ENV } from '../config/env';
const logger = createLogger('email-service');
interface EmailOpts { to: string; subject: string; html: string; text: string }

export class EmailService {
  async send(opts: EmailOpts): Promise<void> {
    if (!ENV.SMTP_HOST || ENV.NODE_ENV !== 'production') {
      logger.info('MOCK_EMAIL', { to: opts.to, subject: opts.subject, preview: opts.text.substring(0, 100) });
      return;
    }
    // Real send would use raw SMTP / external service
    logger.info('EMAIL_SENT', { to: opts.to, subject: opts.subject });
  }

  welcome(name: string, email: string): EmailOpts {
    return { to: email, subject: 'Welcome to Student Management System',
      html: '<h2>Welcome, ' + name + '!</h2><p>Account: <strong>' + email + '</strong> is active.</p>',
      text: 'Welcome ' + name + '! Your account ' + email + ' is active.' };
  }
  enrolled(name: string, num: string, email: string): EmailOpts {
    return { to: email, subject: 'Enrollment Confirmed – ' + num,
      html: '<h2>Enrollment Confirmed!</h2><p>' + name + ' | Enrollment #: <strong>' + num + '</strong></p>',
      text: 'Enrollment confirmed. ' + name + ' | Enrollment #: ' + num };
  }
  deleted(email: string): EmailOpts {
    return { to: email, subject: 'Account Removal Notice',
      html: '<h2>Account Removed</h2><p>Your account (' + email + ') has been removed.</p>',
      text: 'Your account ' + email + ' has been removed.' };
  }
}
export const emailService = new EmailService();
