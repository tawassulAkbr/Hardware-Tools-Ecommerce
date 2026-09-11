import { Router } from 'express';
import { checkout, getMyOrder, myOrders, trackOrder, updateMyOrderStatus } from '../controllers/order';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.get('/track/:id', trackOrder);
router.use(authenticate, authorize('BUYER', 'ADMIN'));
router.post('/', checkout);
router.get('/', myOrders);
// Backward-compatible aliases for existing clients.
router.post('/checkout', checkout);
router.get('/mine', myOrders);
router.get('/mine/:id', getMyOrder);
router.patch('/mine/:id/status', updateMyOrderStatus);
router.get('/:id', getMyOrder);
router.patch('/:id/status', updateMyOrderStatus);
export default router;
