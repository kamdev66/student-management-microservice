import { Router, Next } from '../../shared-local/http';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export function createAuthRouter(): Router {
  const router = new Router();
  router.setPrefix('/api/v1/auth');

  router.post('/register', (req, res, next) => authController.register(req, res).catch(next));
  router.post('/login',    (req, res, next) => authController.login(req, res).catch(next));
  router.post('/refresh',  (req, res, next) => authController.refresh(req, res).catch(next));
  router.post('/validate', (req, res, next) => authController.validate(req, res).catch(next));

  router.post('/logout',     authenticate, (req, res, next) => authController.logout(req, res).catch(next));
  router.post('/logout-all', authenticate, (req, res, next) => authController.logoutAll(req, res).catch(next));
  router.get('/profile',     authenticate, (req, res, next) => authController.profile(req, res).catch(next));

  return router;
}
