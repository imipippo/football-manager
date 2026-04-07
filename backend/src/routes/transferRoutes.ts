import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getMarketListings, 
  listPlayerForTransfer, 
  removeFromTransfer, 
  buyPlayer, 
  getPlayerTransferInfo,
  generateFreeAgents 
} from '../controllers/transferController';

const router = Router();

router.get('/listings', auth, getMarketListings);
router.get('/player/:playerId', auth, getPlayerTransferInfo);
router.post('/list/:playerId', auth, listPlayerForTransfer);
router.delete('/list/:playerId', auth, removeFromTransfer);
router.post('/buy/:playerId', auth, buyPlayer);
router.post('/generate-free-agents', auth, generateFreeAgents);

export default router;
