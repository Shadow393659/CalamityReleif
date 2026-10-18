require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'System Administrator';
  const resetExisting = process.env.ADMIN_RESET_PASSWORD === 'true';

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before creating an administrator.');
  }
  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters long.');
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noor_disaster_db';
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });

  const existingUser = await User.findOne({ email }).select('+password');
  if (existingUser) {
    if (!resetExisting || existingUser.role !== 'System Admin') {
      throw new Error(
        `An account with ${email} already exists (role: ${existingUser.role}). No account was changed. Set ADMIN_RESET_PASSWORD=true only to reset this System Admin account.`
      );
    }

    existingUser.password = password;
    await existingUser.save();
    console.log(`Administrator password updated for ${email}.`);
    return;
  }

  await User.create({
    name,
    email,
    password,
    role: 'System Admin',
    organizationName: 'System Administration',
    verifiedStatus: true,
    operationalZone: 'All Zones',
  });

  console.log(`Administrator account created for ${email}.`);
};

createAdmin()
  .catch((err) => {
    console.error(`[Admin Setup Error] ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
