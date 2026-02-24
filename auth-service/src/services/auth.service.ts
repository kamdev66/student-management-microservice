import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authRepository } from '../repositories/auth.repository';
import { UserRole } from '../models/user.model';
import { ENV } from '../config/env';
import { redisClient } from '../config/redis';
import { publishEvent } from '../config/rabbitmq';
import { AppError, UnauthorizedError, ConflictError, NotFoundError, ForbiddenError } from '../shared-local/errors';
import { createLogger } from '../shared-local/logger';

const logger = createLogger('auth-service');

interface TokenPair { accessToken: string; refreshToken: string }
interface JwtPayload { userId: string; email: string; role: UserRole }

export class AuthService {
  private sign(payload: JwtPayload, secret: string, expiresIn: string): string {
    return jwt.sign({ ...payload, jti: uuidv4() }, secret, { expiresIn } as jwt.SignOptions);
  }

  private tokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken:  this.sign(payload, ENV.JWT_SECRET, ENV.JWT_EXPIRES_IN),
      refreshToken: this.sign(payload, ENV.JWT_REFRESH_SECRET, ENV.JWT_REFRESH_EXPIRES_IN),
    };
  }

  async register(data: { name: string; email: string; password: string; role?: UserRole }) {
    if (await authRepository.exists({ email: data.email.toLowerCase() }))
      throw new ConflictError('Email already registered');

    const user = await authRepository.create(data);
    const tokens = this.tokenPair({ userId: user._id.toString(), email: user.email, role: user.role });
    await authRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    await publishEvent('user.registered', { userId: user._id.toString(), email: user.email, name: user.name, role: user.role });
    logger.info('User registered', { email: user.email });
    return { user, tokens };
  }

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email, true);
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (!user.isActive) throw new ForbiddenError('Account deactivated');

    console.log('passsss',password);
    const valid = await user.comparePassword(password);
    console.log('valid',valid);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const tokens = this.tokenPair({ userId: user._id.toString(), email: user.email, role: user.role });
    await authRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    await publishEvent('user.login', { userId: user._id.toString(), email: user.email, timestamp: new Date().toISOString() });
    logger.info('User logged in', { email: user.email });
    return { user, tokens };
  }

  async refreshToken(token: string): Promise<TokenPair> {
    const blacklisted = await redisClient.get(`bl:${token}`);
    if (blacklisted) throw new UnauthorizedError('Token revoked');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await authRepository.findById(payload.userId, true);
    if (!user) throw new NotFoundError('User');
    if (!user.isActive) throw new ForbiddenError('Account deactivated');

    const stored = (user as any).refreshTokens as string[];
    if (!stored.includes(token)) {
      await authRepository.clearRefreshTokens(user._id.toString());
      throw new UnauthorizedError('Token reuse detected – all sessions revoked');
    }

    await authRepository.removeRefreshToken(user._id.toString(), token);
    const tokens = this.tokenPair({ userId: user._id.toString(), email: user.email, role: user.role });
    await authRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    const ttl = 7 * 24 * 3600;
    await redisClient.setex(`bl:${token}`, ttl, '1');
    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    console.log('1111111111');
    await authRepository.removeRefreshToken(userId, refreshToken);
    await redisClient.setex(`bl:${refreshToken}`, 7 * 24 * 3600, '1');
    logger.info('User logged out', { userId });
  }

  async logoutAll(userId: string): Promise<void> {
    await authRepository.clearRefreshTokens(userId);
    logger.info('All sessions revoked', { userId });
  }

  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async validateToken(token: string): Promise<JwtPayload> {
    const blacklisted = await redisClient.get(`bl:${token}`);
    if (blacklisted) throw new UnauthorizedError('Token revoked');
    try { return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload; }
    catch { throw new UnauthorizedError('Invalid or expired token'); }
  }
}

export const authService = new AuthService();
