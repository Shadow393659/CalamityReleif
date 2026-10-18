const express = require('express');
const router = express.Router();
const ReliefCamp = require('../models/ReliefCamp');
const { getIO } = require('../sockets/socketHandler');
const { allowRoles, requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * @route   GET /api/camps
 * @desc    Fetch relief camps with filters (districtZone, status, near coords)
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, districtZone, lng, lat, maxDistance = 50000 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (districtZone) filter.districtZone = new RegExp(districtZone, 'i');

    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    const camps = await ReliefCamp.find(filter).sort(lng && lat ? {} : { availableSlots: -1 });

    res.status(200).json({
      success: true,
      count: camps.length,
      data: camps,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/camps
 * @desc    Create a new relief camp/shelter
 */
router.post('/', allowRoles('admin'), async (req, res, next) => {
  try {
    const camp = await ReliefCamp.create(req.body);

    const io = getIO();
    if (io) {
      io.to('operations').emit('camp:created', camp);
    }

    res.status(201).json({
      success: true,
      data: camp,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/camps/:id/occupancy
 * @desc    Update camp occupancy count and recalculate available slots
 */
router.patch('/:id/occupancy', allowRoles('admin'), async (req, res, next) => {
  try {
    const { currentOccupancy } = req.body;

    const camp = await ReliefCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, error: 'Relief camp not found' });
    }

    if (currentOccupancy !== undefined) {
      camp.currentOccupancy = Math.max(0, parseInt(currentOccupancy));
    }

    await camp.save();

    const io = getIO();
    if (io) {
      io.to('operations').emit('camp:occupancy_changed', camp);
    }

    res.status(200).json({
      success: true,
      message: 'Camp occupancy updated successfully',
      data: camp,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
