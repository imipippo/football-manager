import { Router } from 'express';
import { protect } from '../middleware/auth';
import { simulateMatch, getFixtures, getNextMatch, getMatchHistory } from '../controllers/matchController';

const router = Router();

router.get('/next', protect, getNextMatch);
router.get('/history', protect, getMatchHistory);
router.post('/simulate', protect, simulateMatch);
router.get('/fixtures', protect, getFixtures);

export default router;
