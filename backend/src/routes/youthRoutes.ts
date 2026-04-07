import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getYouthSquads, 
  promotePlayer, 
  releaseYouthPlayer, 
  refreshYouthSquad,
  scoutYouthPlayer 
} from '../controllers/youthController';

const router = Router();

router.get('/', auth, getYouthSquads);
router.post('/promote', auth, promotePlayer);
router.delete('/release/:playerId/:squad', auth, releaseYouthPlayer);
router.post('/refresh', auth, refreshYouthSquad);
router.post('/scout', auth, scoutYouthPlayer);

export default router;
