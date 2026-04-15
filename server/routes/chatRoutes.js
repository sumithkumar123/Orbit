import express from 'express';
import authApi from '../middleware/authApi.js';
import { listMyThreads, getOrCreateDirectThread, listMessages } from '../controllers/chatController.js';

const router = express.Router();
router.use(authApi);

router.get('/threads', listMyThreads);
router.post('/thread', getOrCreateDirectThread);
router.get('/messages', listMessages);

export default router;
