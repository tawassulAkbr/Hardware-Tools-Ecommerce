import { Router } from 'express';
import { createFeedback } from '../controllers/feedback';

const router = Router();

router.post('/', createFeedback);

export default router;
