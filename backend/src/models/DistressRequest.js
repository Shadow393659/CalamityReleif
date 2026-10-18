const mongoose = require('mongoose');

const TimelineSubSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: [true, 'Timeline status is required'],
      enum: ['Pending', 'Claimed', 'In Progress', 'Resolved', 'False Alarm'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updaterName: {
      type: String,
      trim: true,
      default: 'System / Dispatcher',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const DistressRequestSchema = new mongoose.Schema(
  {
    citizenName: {
      type: String,
      required: [true, 'Citizen name is required'],
      trim: true,
      maxlength: [120, 'Citizen name cannot exceed 120 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Primary contact number is required'],
      trim: true,
    },
    alternateContact: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Geospatial coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 && // longitude
              val[1] >= -90 &&
              val[1] <= 90 // latitude
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] numbers.',
        },
      },
      readableAddress: {
        type: String,
        required: [true, 'Readable address is required'],
        trim: true,
      },
      districtZone: {
        type: String,
        required: [true, 'District / operational zone is required'],
        trim: true,
        index: true,
      },
    },
    needType: {
      type: String,
      required: [true, 'Need type is required'],
      enum: {
        values: ['Food & Water', 'Medical Emergency', 'Emergency Shelter', 'Rescue / Evacuation'],
        message: '{VALUE} is not a valid need type',
      },
      index: true,
    },
    urgencyLevel: {
      type: String,
      required: [true, 'Urgency level is required'],
      enum: {
        values: ['Critical (Life-Threatening)', 'High', 'Moderate', 'Low'],
        message: '{VALUE} is not a valid urgency level',
      },
      default: 'Moderate',
      index: true,
    },
    peopleCount: {
      adults: {
        type: Number,
        default: 1,
        min: [0, 'Adults count cannot be negative'],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, 'Children count cannot be negative'],
      },
      elderly: {
        type: Number,
        default: 0,
        min: [0, 'Elderly count cannot be negative'],
      },
      pets: {
        type: Number,
        default: 0,
        min: [0, 'Pets count cannot be negative'],
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Claimed', 'In Progress', 'Resolved', 'False Alarm'],
        message: '{VALUE} is not a valid distress status',
      },
      default: 'Pending',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: '',
    },
    timeline: [TimelineSubSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total people count (excluding pets)
DistressRequestSchema.virtual('totalPeople').get(function () {
  if (!this.peopleCount) return 1;
  return (this.peopleCount.adults || 0) + (this.peopleCount.children || 0) + (this.peopleCount.elderly || 0);
});

// Optimized 2dsphere index for GeoJSON geospatial queries ($near, $geoWithin, $geoIntersects)
DistressRequestSchema.index({ 'location.coordinates': '2dsphere' });
DistressRequestSchema.index({ location: '2dsphere' });

// Compound indexes for high-throughput real-time control room dashboards
DistressRequestSchema.index({ status: 1, urgencyLevel: 1, createdAt: -1 });
DistressRequestSchema.index({ 'location.districtZone': 1, status: 1, urgencyLevel: 1 });
DistressRequestSchema.index({ assignedTo: 1, status: 1 });

// Pre-save hook: auto-seed the initial timeline item if creating a new distress call
DistressRequestSchema.pre('save', function (next) {
  if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.assignedTo || null,
      updaterName: 'Citizen / Initial Dispatch',
      notes: 'Distress ticket logged into Noor Platform.',
    });
  }
  next();
});

module.exports = mongoose.model('DistressRequest', DistressRequestSchema);
