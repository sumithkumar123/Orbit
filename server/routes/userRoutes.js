// server/routes/userRoutes.js
import express from 'express';
import upload from '../middleware/multer.js';
import { createUser  , loginUser} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', upload.single('image'), createUser);
router.post('/login', loginUser);

export default router;
