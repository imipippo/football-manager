import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getTeamCoaches, 
  getAvailableCoaches, 
  hireCoach, 
  fireCoach, 
  generateCoaches,
  getTrainingBonus 
} from '../controllers/coachController';

const router = Router();

router.get('/team', auth, getTeamCoaches);
router.get('/available', auth, getAvailableCoaches);
router.get('/bonus', auth, getTrainingBonus);
router.post('/hire', auth, hireCoach);
router.delete('/fire/:coachId', auth, fireCoach);
router.post('/generate', auth, generateCoaches);

export default router;
