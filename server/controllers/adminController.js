import bcrypt from 'bcryptjs';
import { getSystemState, setSystemState } from '../utils/systemState.js';
import User from '../models/userModel.js';

const normalizeEmail = (value = '') => value.trim().toLowerCase();

const sanitizeUser = (user) => {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
};

export async function adminGetSystem(req, res) {
  res.json(getSystemState());
}

export async function adminSetSystem(req, res) {
  const { running, reason } = req.body || {};
  if (typeof running !== 'boolean') {
    return res.status(400).json({ message: 'running (boolean) is required' });
  }
  const io = req.app.get('io');
  const state = await setSystemState({ running, reason }, io);
  res.json(state);
}

export async function adminListUsers(_req, res) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('adminListUsers error:', error);
    res.status(500).json({ message: 'Failed to load users.' });
  }
}

export async function adminCreateUser(req, res) {
  try {
    const { name, email, mobile, address, tag, image, password, role } = req.body || {};

    if (!name || !email || !mobile || !address || !tag) {
      return res.status(400).json({ message: 'name, email, mobile, address, and tag are required.' });
    }

    const normalizedEmail = normalizeEmail(email);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const finalPassword = password || 'orbit123';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const fallbackImage = image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`;

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      address,
      tag,
      image: fallbackImage,
      password: hashedPassword,
      role: role || 'user',
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: sanitizeUser(user),
      defaultPassword: finalPassword,
    });
  } catch (error) {
    console.error('adminCreateUser error:', error);
    res.status(500).json({ message: 'Failed to create user.' });
  }
}

export async function adminDeleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('adminDeleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
}

export async function adminResetPassword(req, res) {
  try {
    const { name, email, newPassword } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if ((user.name || '').trim().toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Name does not match our records.' });
    }

    const passwordToSet = newPassword || 'orbit123';
    user.password = await bcrypt.hash(passwordToSet, 10);
    await user.save();

    res.json({
      message: 'Password reset successfully.',
      user: sanitizeUser(user),
      temporaryPassword: passwordToSet,
    });
  } catch (error) {
    console.error('adminResetPassword error:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
}
