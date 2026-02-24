import { validate, Schema } from '../shared-local/validator';
import { UserRole } from '../models/user.model';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const registerSchema: Schema = {
  name:     { type: 'string', required: true, minLength: 2, maxLength: 100, trim: true },
  email:    { type: 'email',  required: true },
  password: { type: 'string', required: true, minLength: 8, maxLength: 128, pattern: PASSWORD_PATTERN },
  role:     { type: 'string', required: false, enum: Object.values(UserRole), default: UserRole.STUDENT },
};

export const loginSchema: Schema = {
  email:    { type: 'email',  required: true },
  password: { type: 'string', required: true },
};

export const refreshSchema: Schema = {
  refreshToken: { type: 'string', required: true },
};

export { validate };
