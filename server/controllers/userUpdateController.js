// server/controllers/userUpdateController.js
import User from "../models/userModel.js";
// import cloudinary from "../config/cloudinary.js"; // Removed for offline mode

// GET /api/users/profile
// Private
const resolveUserId = (req) => req.user?.id || req.user?._id;

export const getProfile = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile fetched successfully.",
      user,
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// PUT /api/users/profile
// Private
export const updateProfile = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Text fields
    const { name, mobile, address, tag } = req.body;

    if (typeof name !== "undefined") user.name = name;
    if (typeof mobile !== "undefined") user.mobile = mobile;
    if (typeof address !== "undefined") user.address = address;
    if (typeof tag !== "undefined") user.tag = tag;

    // If you want email to be changeable here, uncomment this:
    // if (email) user.email = email;

    // Image upload (optional)
    // Image upload (optional)
    if (req.file) {
      // Offline Mode: Use local file path
      // The server serves 'public/uploads' at '/uploads'
      // We store the relative path or full URL. Storing relative is safer for port changes.
      // But frontend might expect full URL. Let's store relative and ensure frontend handles it,
      // OR store full URL assuming server doesn't change common ports.

      // Better: Store relative path `/uploads/${filename}`
      user.image = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    const userSafe = updatedUser.toObject();
    delete userSafe.password;

    res.status(200).json({
      message: "Profile updated successfully.",
      user: userSafe,
    });
  } catch (error) {
    console.error("updateProfile error:", error);

    // Handle duplicate email, etc. if you allow email change
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use." });
    }

    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// DELETE /api/users/profile
// Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Optional: if you store Cloudinary public_id, you can also delete image:
    // if (user.imagePublicId) {
    //   await cloudinary.uploader.destroy(user.imagePublicId);
    // }

    await User.findByIdAndDelete(userId);

    // If you have related models (tickets, orders, etc.), you can clean up here

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("deleteAccount error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// GET /api/users/all
// Private
export const listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("listUsers error:", error);
    res.status(500).json({ message: "Failed to load users." });
  }
};
