import { studentRepository, StudentFilter, PaginationOpts } from '../repositories/student.repository';
import { IStudent } from '../models/student.model';
import { ConflictError, NotFoundError } from '../shared-local/errors';
import { redisClient } from '../config/redis';
import { publishEvent } from '../config/rabbitmq';
import { createLogger } from '../shared-local/logger';
import { ENV } from '../config/env';

const logger = createLogger('student-service');
const CACHE_TTL = ENV.CACHE_TTL;

export class StudentService {
  private key(id: string) { return 'stu:' + id; }
  private listKey(filter: object, opts: object) { return 'stu:list:' + JSON.stringify({ filter, opts }); }

  async create(data: Partial<IStudent>, createdBy: string): Promise<IStudent> {
    if (await studentRepository.exists({ email: data.email }))
      throw new ConflictError('Email already registered for a student');

    const student = await studentRepository.create({ ...data, createdBy });

    await publishEvent('student.created', {
      studentId: student._id.toString(), email: student.email,
      firstName: student.firstName, lastName: student.lastName,
      enrollmentNumber: student.enrollmentNumber,
    });
    logger.info('Student created', { enrollmentNumber: student.enrollmentNumber });
    return student;
  }

  async getAll(filter: StudentFilter, opts: PaginationOpts) {
    const cacheKey = this.listKey(filter, opts);
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) { logger.debug('Cache hit: student list'); return JSON.parse(cached); }
    } catch { /* redis unavailable, proceed */ }

    const result = await studentRepository.findAll(filter, opts);

    try { await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result)); }
    catch { /* redis unavailable */ }

    return result;
  }

  async getById(id: string): Promise<IStudent> {
    const cacheKey = this.key(id);
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* redis unavailable */ }

    const student = await studentRepository.findById(id);
    if (!student) throw new NotFoundError('Student');

    try { await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(student)); }
    catch { /* redis unavailable */ }

    return student;
  }

  async update(id: string, data: Partial<IStudent>, updatedBy: string): Promise<IStudent> {
    if (!(await studentRepository.exists({ _id: id }))) throw new NotFoundError('Student');

    if (data.email) {
      const conflict = await studentRepository.findByEmail(data.email);
      if (conflict && conflict._id.toString() !== id) throw new ConflictError('Email in use');
    }

    const student = await studentRepository.update(id, { ...data, updatedBy });
    if (!student) throw new NotFoundError('Student');

    try { await redisClient.del(this.key(id)); } catch { /* ok */ }

    await publishEvent('student.updated', { studentId: id, updatedFields: Object.keys(data) });
    logger.info('Student updated', { id });
    return student;
  }

  async delete(id: string): Promise<void> {
    const student = await studentRepository.findById(id);
    if (!student) throw new NotFoundError('Student');

    await studentRepository.delete(id);
    try { await redisClient.del(this.key(id)); } catch { /* ok */ }

    await publishEvent('student.deleted', { studentId: id, email: student.email, enrollmentNumber: student.enrollmentNumber });
    logger.info('Student deleted', { id });
  }

  async getStats() {
    const cacheKey = 'stu:stats';
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* ok */ }

    const stats = await studentRepository.getStats();
    try { await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(stats)); } catch { /* ok */ }
    return stats;
  }
}

export const studentService = new StudentService();
