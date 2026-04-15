import express from 'express';
import authApi from '../middleware/authApi.js';
import requireAdmin from '../middleware/requireAdmin.js';
import {
  adminGetSystem,
  adminSetSystem,
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authApi);
router.use(requireAdmin);

// GET /api/admin/system
router.get('/system', adminGetSystem);

// PUT /api/admin/system  { running: boolean, reason?: string }
router.put('/system', adminSetSystem);

router.get('/users', adminListUsers);
router.post('/users', adminCreateUser);
router.delete('/users/:id', adminDeleteUser);
router.post('/users/reset-password', adminResetPassword);

export default router;
