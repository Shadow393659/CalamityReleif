const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User or agent name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not expose password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: [
          'Citizen',
          'Volunteer',
          'NGO Field Agent',
          'Government Control Room',
          'System Admin',
        ],
        message: '{VALUE} is not a valid user role',
      },
      default: 'Citizen',
      index: true,
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
    },
    verifiedStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    operationalZone: {
      type: String,
      trim: true,
      default: 'All Zones',
      index: true,
    },
    activeStatus: {
      type: String,
      enum: {
        values: ['Available', 'Busy', 'Off-duty'],
        message: '{VALUE} is not a valid active status',
      },
      default: 'Available',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [], // e.g., ['First Aid', 'Boat Rescue', 'Water Purification', 'Radio Comms']
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Compound index for control room dispatcher lookup
UserSchema.index({ role: 1, operationalZone: 1, activeStatus: 1 });
UserSchema.index({ email: 1 });

// Pre-save hook to hash password using bcryptjs
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
