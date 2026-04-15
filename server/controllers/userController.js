// server/controllers/userController.js
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const normalizeEmail = (value = '') => value.trim().toLowerCase();

// helper to sign JWT
function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role || 'user',
      name: user.name || '',
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { image, name, mobile, address, tag, email, password, role } = req.body;

    if (!image || !name || !mobile || !address || !tag || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      image,
      name,
      mobile,
      address,
      tag,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();

    // optional: issue a token immediately after registration
    const token = signToken(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        tag: newUser.tag,
        image: newUser.image,
        role: newUser.role,
      },
      token, // <-- returned if you want auto-login after register
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = signToken(existingUser);
    console.log(token);

    return res.status(200).json({
      message: 'Login successful',
      role: existingUser.role || 'user',
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        image: existingUser.image,
        tag: existingUser.tag,
        role: existingUser.role,
      },
      token, // <-- IMPORTANT for your frontend + sockets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
