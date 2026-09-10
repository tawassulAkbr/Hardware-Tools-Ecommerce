import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/product';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('ADMIN', 'SALES_PERSON'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'SALES_PERSON'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN', 'SALES_PERSON'), deleteProduct);
export default router;
