import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createTransaction, getMyTransactions, getIncomingRequests, deleteTransaction } from '../controllers/transactions.controller';

const router = Router();

router.post('/', authenticate, createTransaction);
router.get('/incoming', authenticate, getIncomingRequests);
router.get('/mine', authenticate, getMyTransactions);
router.delete('/:id', authenticate, deleteTransaction);

export default router;
