import { Router } from '../shared-local/http';
import { studentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export function createStudentRouter(): Router {
  const router = new Router();
  router.setPrefix('/api/v1/students');

  router.get('/stats', authenticate, authorize('admin', 'teacher'), (req, res, next) => studentController.getStats(req, res).catch(next));
  router.get('/all-student',      authenticate, authorize('admin', 'teacher', 'student'), (req, res, next) => studentController.getAll(req, res).catch(next));
  router.get('/:id',   authenticate, authorize('admin', 'teacher', 'student'), (req, res, next) => studentController.getById(req, res).catch(next));
  router.post('/add-student', authenticate, authorize('admin', 'teacher'), (req, res, next) => studentController.create(req, res).catch(next));
  router.put('/:id',   authenticate, authorize('admin', 'teacher'), (req, res, next) => studentController.update(req, res).catch(next));
  router.delete('/:id', authenticate, authorize('admin'), (req, res, next) => studentController.delete(req, res).catch(next));

  return router;
}
