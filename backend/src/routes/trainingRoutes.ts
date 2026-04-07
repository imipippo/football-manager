import { Router } from 'express';
import { auth } from '../middleware/auth';
import { trainPlayer, getTrainingStatus, getTeamTrainingStatus } from '../controllers/trainingController';

const router = Router();

router.post('/:playerId', auth, trainPlayer);
router.get('/status/:playerId', auth, getTrainingStatus);
router.get('/team', auth, getTeamTrainingStatus);

export default router;
