import { Router } from 'express';
import { createFeedback, listApprovedReviews } from '../controllers/feedback';

const router = Router();

router.post('/', createFeedback);
router.get('/reviews', listApprovedReviews);

export default router;
