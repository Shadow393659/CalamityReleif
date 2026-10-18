const mongoose = require('mongoose');

const ReliefCampSchema = new mongoose.Schema(
  {
    campName: {
      type: String,
      required: [true, 'Camp / Shelter name is required'],
      trim: true,
      maxlength: [150, 'Camp name cannot exceed 150 characters'],
    },
    address: {
      type: String,
      required: [true, 'Camp physical address is required'],
      trim: true,
    },
    districtZone: {
      type: String,
      trim: true,
      default: 'Coastal Command',
      index: true,
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
        required: [true, 'Coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Camp coordinates must be valid [longitude, latitude] numbers.',
        },
      },
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
    },
    availableSlots: {
      type: Number,
      default: 0,
      min: [0, 'Available slots cannot be negative'],
    },
    facilitiesAvailable: {
      type: [String],
      default: [],
      // e.g. ['Doctor on site', 'Clean Water', 'Baby Food', 'Electricity', 'Warm Blankets', 'Sanitation Kits', 'Emergency Generator']
    },
    contactPerson: {
      type: String,
      required: [true, 'Camp administrator contact person is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Full', 'Closed'],
        message: '{VALUE} is not a valid relief camp status',
      },
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual calculation for occupancy percentage
ReliefCampSchema.virtual('occupancyPercentage').get(function () {
  if (!this.totalCapacity) return 0;
  return Math.min(100, Math.round((this.currentOccupancy / this.totalCapacity) * 100));
});

// 2dsphere index for geospatial shelter proximity queries
ReliefCampSchema.index({ location: '2dsphere' });
ReliefCampSchema.index({ 'location.coordinates': '2dsphere' });

// Compound indexes for map filtering
ReliefCampSchema.index({ status: 1, districtZone: 1 });
ReliefCampSchema.index({ availableSlots: 1, status: 1 });

// Pre-save hook: compute availableSlots and update status if capacity is exhausted
ReliefCampSchema.pre('save', function (next) {
  const calculatedSlots = Math.max(0, this.totalCapacity - (this.currentOccupancy || 0));
  this.availableSlots = calculatedSlots;

  if (this.status !== 'Closed') {
    if (this.availableSlots === 0) {
      this.status = 'Full';
    } else if (this.status === 'Full' && this.availableSlots > 0) {
      this.status = 'Active';
    }
  }

  next();
});

module.exports = mongoose.model('ReliefCamp', ReliefCampSchema);
