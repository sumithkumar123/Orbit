import express from 'express';
import authApi from '../middleware/authApi.js';
import { getSystemState } from '../utils/systemState.js';

const router = express.Router();
router.use(authApi);

// GET /api/system/state
router.get('/state', async (req, res) => {
  res.json(getSystemState());
});

export default router;
