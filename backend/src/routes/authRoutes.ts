import { Router } from 'express';
import { 
  sendSmsCode, 
  loginWithPhone, 
  loginWithWechat, 
  bindPhone, 
  updateProfile, 
  getProfile 
} from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/sms/send', sendSmsCode);
router.post('/login/phone', loginWithPhone);
router.post('/login/wechat', loginWithWechat);
router.post('/bind-phone', auth, bindPhone);
router.put('/profile', auth, updateProfile);
router.get('/profile', auth, getProfile);

export default router;
