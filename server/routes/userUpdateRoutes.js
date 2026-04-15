// server/routes/userUpdateRoutes.js
import express from "express";
import {
  getProfile,
  updateProfile,
  deleteAccount,
  listUsers,
} from "../controllers/userUpdateController.js";
import upload from "../middleware/multer.js";
import authApi from "../middleware/authApi.js";

const router = express.Router();


router.use(authApi);

router.get("/all", listUsers);

router.get("/profile", getProfile);


router.put(
  "/profile",
  upload.single("image"), // "image" must match the field used in frontend FormData
  updateProfile
);


router.delete("/profile", deleteAccount);

export default router;
