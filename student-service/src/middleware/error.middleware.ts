import { AppRequest, AppResponse } from '../../shared-local/http';
import { AppError } from '../../shared-local/errors';
import { createLogger } from '../../shared-local/logger';

const logger = createLogger('error');

export function errorHandler(err: Error, req: AppRequest, res: AppResponse): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if ((err as any).code === 11000) {
    statusCode = 409; message = 'Duplicate entry';
  } else if ((err as any).name === 'CastError') {
    statusCode = 400; message = 'Invalid ID format';
  }

  if (statusCode >= 500) logger.error(err.message, { stack: err.stack, path: req.url });

  res.json(statusCode, {
    success: false, message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
}
