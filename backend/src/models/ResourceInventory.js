const mongoose = require('mongoose');

const ResourceInventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: {
        values: [
          'Food Packets',
          'Drinking Water (Liters)',
          'Medical Kits',
          'Blankets',
          'Rescue Boats',
          'Tents',
        ],
        message: '{VALUE} is not a valid resource item type',
      },
      index: true,
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total inventory quantity is required'],
      min: [0, 'Total quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    allocatedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Allocated quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: 'units',
      trim: true,
    },
    warehouseLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Warehouse coordinates [lng, lat] are required'],
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
          message: 'Warehouse coordinates must be valid [longitude, latitude] numbers.',
        },
      },
      address: {
        type: String,
        required: [true, 'Warehouse address is required'],
        trim: true,
      },
      districtZone: {
        type: String,
        trim: true,
      },
    },
    managedByOrg: {
      type: String,
      required: [true, 'Managing organization name is required'],
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geo-spatial index for warehouse proximity queries
ResourceInventorySchema.index({ warehouseLocation: '2dsphere' });
ResourceInventorySchema.index({ 'warehouseLocation.coordinates': '2dsphere' });

// Compound indexes for logistics dashboards and filter queries
ResourceInventorySchema.index({ itemType: 1, managedByOrg: 1 });
ResourceInventorySchema.index({ 'warehouseLocation.districtZone': 1, itemType: 1 });
ResourceInventorySchema.index({ availableQuantity: 1 });

// Ensure available + allocated sync before saving
ResourceInventorySchema.pre('save', function (next) {
  if (this.isModified('totalQuantity') || this.isModified('allocatedQuantity')) {
    this.availableQuantity = Math.max(0, this.totalQuantity - (this.allocatedQuantity || 0));
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('ResourceInventory', ResourceInventorySchema);
