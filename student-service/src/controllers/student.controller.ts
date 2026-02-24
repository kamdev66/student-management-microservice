import { AppRequest, AppResponse, success, created } from '../shared-local/http';
import { studentService } from '../services/student.service';
import { validate } from '../shared-local/validator';
import { createStudentSchema, updateStudentSchema, querySchema } from '../validators/student.validator';
import { ValidationError, NotFoundError } from '../shared-local/errors';

export class StudentController {
  async create(req: AppRequest, res: AppResponse): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const { valid, errors, value } = validate(body, createStudentSchema);
    if (!valid) throw new ValidationError('Validation failed', errors);
    const student = await studentService.create(value as any, req.user!.userId);
    created(res, { student }, 'Student created successfully');
  }

  async getAll(req: AppRequest, res: AppResponse): Promise<void> {
    const q = req.query as Record<string, unknown>;
    const { valid, errors, value } = validate(q, querySchema);
    if (!valid) throw new ValidationError('Invalid query parameters', errors);

    const result = await studentService.getAll(
      { search: value.search as string, department: value.department as string,
        enrollmentStatus: value.enrollmentStatus as any, grade: value.grade as string },
      { page: value.page as number, limit: value.limit as number,
        sortBy: value.sortBy as string, sortOrder: value.sortOrder as 'asc' | 'desc' }
    );

    res.json(200, {
      success: true, message: 'Students fetched',
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    });
  }

  async getById(req: AppRequest, res: AppResponse): Promise<void> {
    const student = await studentService.getById(req.params.id);
    success(res, { student }, 'Student fetched');
  }

  async update(req: AppRequest, res: AppResponse): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const { valid, errors, value } = validate(body, updateStudentSchema);
    if (!valid) throw new ValidationError('Validation failed', errors);
    if (Object.keys(value).length === 0) throw new ValidationError('At least one field required');
    const student = await studentService.update(req.params.id, value as any, req.user!.userId);
    success(res, { student }, 'Student updated');
  }

  async delete(req: AppRequest, res: AppResponse): Promise<void> {
    await studentService.delete(req.params.id);
    success(res, null, 'Student deleted');
  }

  async getStats(req: AppRequest, res: AppResponse): Promise<void> {
    const stats = await studentService.getStats();
    success(res, { stats }, 'Stats fetched');
  }
}

export const studentController = new StudentController();
