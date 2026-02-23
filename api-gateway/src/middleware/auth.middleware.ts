import jwt from 'jsonwebtoken';
import { AppRequest, AppResponse, Next } from '../../shared-local/http';
import { UnauthorizedError, ForbiddenError } from '../../shared-local/errors';
import { ENV } from '../config/env';

// export function authenticate(req: AppRequest, _res: AppResponse, next: Next): void {
//   try {
//     const auth = req.headers['authorization'] as string;
//     if (!auth?.startsWith('Bearer ')) return next(new UnauthorizedError());
//     const payload = jwt.verify(auth.split(' ')[1], ENV.JWT_SECRET) as { userId: string; email: string; role: string };
//     req.user = payload;
//     return next();
//   } catch {
//     return next(new UnauthorizedError('Invalid or expired token'));
//   }
// }

// export function authorize(...roles: string[]) {
//   return (req: AppRequest, _res: AppResponse, next: Next): void => {
//     if (!req.user) return next(new UnauthorizedError());
//     if (!roles.includes(req.user.role)) return next(new ForbiddenError());
//     next();
//   };
// }


export function authenticate(
  req: AppRequest,
  _res: AppResponse,
  next: Next
): void | Promise<void> {
  try {
    const auth = req.headers['authorization'] as string;

    if (!auth?.startsWith('Bearer '))
      return next(new UnauthorizedError());

    const payload = jwt.verify(
      auth.split(' ')[1],
      ENV.JWT_SECRET
    ) as { userId: string; email: string; role: string };

    req.user = payload;

    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...roles: string[]) {
  return (
    req: AppRequest,
    _res: AppResponse,
    next: Next
  ): void | Promise<void> => {

    if (!req.user)
      return next(new UnauthorizedError());

    if (!roles.includes(req.user.role))
      return next(new ForbiddenError());

    return next();
  };
}