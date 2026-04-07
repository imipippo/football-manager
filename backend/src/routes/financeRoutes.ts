import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getFinanceOverview, 
  getSponsorOffers, 
  acceptSponsor, 
  processWeeklyFinances,
  upgradeFacility 
} from '../controllers/financeController';

const router = Router();

router.get('/overview', auth, getFinanceOverview);
router.get('/sponsors', auth, getSponsorOffers);
router.post('/sponsors/accept', auth, acceptSponsor);
router.post('/weekly', auth, processWeeklyFinances);
router.post('/upgrade', auth, upgradeFacility);

export default router;
