import { AppRequest, AppResponse, success, created } from '../shared-local/http';
import { authService } from '../services/auth.service';
import { validate, registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import { ValidationError, UnauthorizedError } from '../shared-local/errors';

export class AuthController {
  async register(req: AppRequest, res: AppResponse): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const { valid, errors, value } = validate(body, registerSchema);
    if (!valid) throw new ValidationError('Validation failed', errors);

    const result = await authService.register(value as any);
    created(res, { user: result.user, tokens: result.tokens }, 'User registered successfully');
  }

  async login(req: AppRequest, res: AppResponse): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const { valid, errors, value } = validate(body, loginSchema);
    if (!valid) throw new ValidationError('Validation failed', errors);

    const result = await authService.login(value.email as string, value.password as string);
    success(res, { user: result.user, tokens: result.tokens }, 'Login successful');
  }

  async refresh(req: AppRequest, res: AppResponse): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const { valid, errors, value } = validate(body, refreshSchema);
    if (!valid) throw new ValidationError('Validation failed', errors);

    const tokens = await authService.refreshToken(value.refreshToken as string);
    success(res, { tokens }, 'Token refreshed successfully');
  }

 async logout(req: AppRequest, res: AppResponse): Promise<void> {
  console.log('Logout hit');

  if (!req.user?.userId) {
    throw new UnauthorizedError();
  }
  const auth = req.headers['authorization'] as string;
  if (!auth?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header required');
  }
  const accessToken = auth.split(' ')[1];
  await authService.logout(req.user.userId, accessToken);
  success(res, null, 'Logged out successfully');
}

  async logoutAll(req: AppRequest, res: AppResponse): Promise<void> {
    if (!req.user?.userId) throw new UnauthorizedError();
    await authService.logoutAll(req.user.userId);
    success(res, null, 'All sessions revoked');
  }

  async profile(req: AppRequest, res: AppResponse): Promise<void> {
    if (!req.user?.userId) throw new UnauthorizedError();
    const user = await authService.getProfile(req.user.userId);
    success(res, { user }, 'Profile fetched');
  }

  async validate(req: AppRequest, res: AppResponse): Promise<void> {
  const auth = req.headers['authorization'] as string;
  if (!auth?.startsWith('Bearer ')) throw new ValidationError('Authorization header required');
  
  const token = auth.split(' ')[1];
  const payload = await authService.validateToken(token);
  success(res, { payload });
}
}

export const authController = new AuthController();
