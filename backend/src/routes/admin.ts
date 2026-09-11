import { Router } from 'express';
import { dashboard, listUsers, createUser, updateUser, deleteUser, listAuditLogs, getMaintenance, updateMaintenance } from '../controllers/admin';
import { listAllOrders, updateOrderAdmin } from '../controllers/order';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.get('/dashboard', authorize('ADMIN'), dashboard);
router.get('/users', authorize('ADMIN'), listUsers);
router.post('/users', authorize('ADMIN'), createUser);
router.patch('/users/:id', authorize('ADMIN'), updateUser);
router.delete('/users/:id', authorize('ADMIN'), deleteUser);
router.get('/orders', authorize('ADMIN', 'SALES_PERSON'), listAllOrders);
router.patch('/orders/:id', authorize('ADMIN', 'SALES_PERSON'), updateOrderAdmin);
router.get('/logs', authorize('ADMIN'), listAuditLogs);
router.get('/maintenance', authorize('ADMIN'), getMaintenance);
router.patch('/maintenance', authorize('ADMIN'), updateMaintenance);
export default router;
