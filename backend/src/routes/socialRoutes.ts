import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getFriends, 
  getPendingRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  getFriendDynamics 
} from '../controllers/socialController';

const router = Router();

router.get('/friends', auth, getFriends);
router.get('/requests', auth, getPendingRequests);
router.get('/search', auth, searchUsers);
router.get('/dynamics', auth, getFriendDynamics);
router.post('/request', auth, sendFriendRequest);
router.post('/accept/:requestId', auth, acceptFriendRequest);
router.post('/reject/:requestId', auth, rejectFriendRequest);
router.delete('/friend/:friendId', auth, removeFriend);

export default router;
