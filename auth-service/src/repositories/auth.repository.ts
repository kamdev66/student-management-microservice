import { User, IUser, UserRole } from '../models/user.model';
import { FilterQuery } from 'mongoose';

export class AuthRepository {
  findByEmail(email: string, withSecrets = false): Promise<IUser | null> {
    const q = User.findOne({ email: email.toLowerCase() });
    if (withSecrets) q.select('+password +refreshTokens');
    return q.exec();
  }

  findById(id: string, withTokens = false): Promise<IUser | null> {
    const q = User.findById(id);
    if (withTokens) q.select('+refreshTokens');
    return q.exec();
  }

  create(data: { name: string; email: string; password: string; role?: UserRole }): Promise<IUser> {
    return new User(data).save();
  }

  addRefreshToken(userId: string, token: string): Promise<unknown> {
    return User.findByIdAndUpdate(userId, { $push: { refreshTokens: token }, lastLogin: new Date() });
  }

  removeRefreshToken(userId: string, token: string): Promise<unknown> {
    return User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
  }

  clearRefreshTokens(userId: string): Promise<unknown> {
    return User.findByIdAndUpdate(userId, { refreshTokens: [] });
  }

  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    return !!(await User.exists(filter));
  }
}

export const authRepository = new AuthRepository();
