import { Router } from 'express';
import { addToCart, getCart, removeCartItem, updateCartItem } from '../controllers/cart';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate, authorize('BUYER', 'ADMIN'));
router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
export default router;
