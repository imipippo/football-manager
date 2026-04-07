import { Router } from 'express';
import { getPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer, searchPlayers, getMyPlayers } from '../controllers/playerController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/my', auth, getMyPlayers);
router.get('/', auth, getPlayers);
router.get('/search', auth, searchPlayers);
router.get('/:id', auth, getPlayer);
router.post('/', auth, createPlayer);
router.put('/:id', auth, updatePlayer);
router.delete('/:id', auth, deletePlayer);

export default router;
