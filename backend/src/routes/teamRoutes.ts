import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getMyTeam,
  getTeamById,
  createTeam,
  updateTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
} from '../controllers/teamController';

const router = Router();

router.get('/my', protect, getMyTeam);
router.get('/:id', protect, getTeamById);
router.post('/', protect, createTeam);
router.put('/', protect, updateTeam);
router.post('/players', protect, addPlayerToTeam);
router.delete('/players/:playerId', protect, removePlayerFromTeam);

export default router;
