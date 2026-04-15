import jwt from 'jsonwebtoken';

export default function authApi(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role, name: payload.name, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
