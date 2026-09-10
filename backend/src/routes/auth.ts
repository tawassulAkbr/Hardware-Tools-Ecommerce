import { Router } from 'express';
import { deleteProfile, forgotPassword, googleConfig, googleLogin, login, me, register, resetPassword, updateProfile, revokeToken } from '../controllers/auth';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/config', googleConfig);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateProfile);
router.delete('/me', authenticate, deleteProfile);
router.post('/logout', authenticate, (req: any, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) revokeToken(header.slice(7));
  return res.status(204).send();
});
export default router;
