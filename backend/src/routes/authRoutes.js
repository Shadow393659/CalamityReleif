const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole, requireAuth, allowRoles } = require('../middleware/auth');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'noor_disaster_secret_fallback_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new volunteer, responder, or citizen
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, organizationName, operationalZone, phone, skills } = req.body;
    const requestedRole = role || 'citizen';

    if (!['citizen', 'ngo'].includes(requestedRole)) {
      return res.status(400).json({ success: false, error: 'Choose Citizen or NGO to register' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole === 'ngo' ? 'NGO Field Agent' : 'Citizen',
      organizationName: organizationName || '',
      operationalZone: operationalZone || 'All Zones',
      phone: phone || '',
      skills: skills || [],
      verifiedStatus: requestedRole === 'citizen',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessRole: normalizeRole(user.role),
        organizationName: user.organizationName,
        operationalZone: user.operationalZone,
        verifiedStatus: user.verifiedStatus,
        activeStatus: user.activeStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Explicitly select password since select: false in schema
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (role && normalizeRole(user.role) !== role) {
      return res.status(403).json({ success: false, error: 'This account does not have the selected role' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessRole: normalizeRole(user.role),
        organizationName: user.organizationName,
        operationalZone: user.operationalZone,
        verifiedStatus: user.verifiedStatus,
        activeStatus: user.activeStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  const { _id, name, email, role, organizationName, operationalZone, verifiedStatus, activeStatus } = req.user;
  res.status(200).json({
    success: true,
    user: {
      id: _id,
      name,
      email,
      role,
      accessRole: req.user.accessRole,
      organizationName,
      operationalZone,
      verifiedStatus,
      activeStatus,
    },
  });
});

/**
 * @route   GET /api/auth/responders
 * @desc    List active responders and field agents for dispatch assignment
 */
router.get('/responders', requireAuth, allowRoles('ngo', 'admin'), async (req, res, next) => {
  try {
    const { operationalZone } = req.query;
    const filter = {
      role: { $in: ['Volunteer', 'NGO Field Agent', 'Government Control Room'] },
      activeStatus: { $ne: 'Off-duty' },
    };

    if (operationalZone) {
      filter.operationalZone = new RegExp(operationalZone, 'i');
    }

    const responders = await User.find(filter).select('-password').sort({ activeStatus: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: responders.length,
      data: responders,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
