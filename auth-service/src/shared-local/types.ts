// ─── Shared types across all microservices ────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum EventType {
  STUDENT_CREATED = 'student.created',
  STUDENT_UPDATED = 'student.updated',
  STUDENT_DELETED = 'student.deleted',
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseEvent {
  eventType: EventType;
  timestamp: string;
  correlationId: string;
  payload: Record<string, unknown>;
}
