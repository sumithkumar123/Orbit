import express from "express";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    // Return the local URL
    res.json({
        secure_url: `/uploads/${req.file.filename}`,
        url: `/uploads/${req.file.filename}`
    });
});

export default router;
