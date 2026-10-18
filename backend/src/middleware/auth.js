const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeRole = (role) => {
  if (role === 'Citizen') return 'citizen';
  if (['Volunteer', 'NGO Field Agent'].includes(role)) return 'ngo';
  if (['Government Control Room', 'System Admin'].includes(role)) return 'admin';
  return null;
};

const requireAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'noor_disaster_secret_fallback_key'
    );
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Account no longer exists' });
    }

    req.user = user;
    req.user.accessRole = normalizeRole(user.role);
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    next(err);
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.accessRole)) {
    return res.status(403).json({ success: false, error: 'You do not have access to this resource' });
  }
  next();
};

module.exports = { allowRoles, normalizeRole, requireAuth };
