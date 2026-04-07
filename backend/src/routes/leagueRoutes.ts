import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getLeagues,
  getLeagueById,
  getLeagueStandings,
  getMyLeagueStandings,
  createLeague,
} from '../controllers/leagueController';

const router = Router();

router.get('/standings', protect, getMyLeagueStandings);
router.get('/', protect, getLeagues);
router.get('/:id', protect, getLeagueById);
router.get('/:id/standings', protect, getLeagueStandings);
router.post('/', protect, createLeague);

export default router;
