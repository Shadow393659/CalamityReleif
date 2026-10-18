const express = require('express');
const router = express.Router();
const DistressRequest = require('../models/DistressRequest');
const { broadcastDistressEvent } = require('../sockets/socketHandler');
const { allowRoles, requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * @route   GET /api/distress
 * @desc    Fetch distress requests with filtering, pagination, and geo-spatial proximity
 */
router.get('/', allowRoles('ngo', 'admin'), async (req, res, next) => {
  try {
    const {
      status,
      urgencyLevel,
      needType,
      districtZone,
      lng,
      lat,
      maxDistance = 50000, // 50km default radius
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (urgencyLevel) filter.urgencyLevel = urgencyLevel;
    if (needType) filter.needType = needType;
    if (districtZone) filter['location.districtZone'] = new RegExp(districtZone, 'i');

    // Geo-spatial proximity search if longitude and latitude are provided
    if (lng && lat) {
      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, totalCount] = await Promise.all([
      DistressRequest.find(filter)
        .populate('assignedTo', 'name email role organizationName phone')
        .sort(lng && lat ? {} : { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DistressRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: requests,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/distress
 * @desc    Create a new distress request and broadcast via Socket.io
 */
router.post('/', allowRoles('citizen', 'admin'), async (req, res, next) => {
  try {
    const distress = await DistressRequest.create({
      ...req.body,
      reportedBy: req.user._id,
    });

    // Broadcast real-time event to connected disaster control rooms and district channels
    broadcastDistressEvent('distress:created', distress, distress.location?.districtZone);

    res.status(201).json({
      success: true,
      message: 'Distress call registered successfully.',
      data: distress,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/distress/:id
 * @desc    Fetch distress request by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const request = await DistressRequest.findById(req.params.id)
      .populate('assignedTo', 'name email role organizationName phone activeStatus')
      .populate('timeline.updatedBy', 'name role organizationName');

    if (!request) {
      return res.status(404).json({ success: false, error: 'Distress request not found' });
    }

    if (!['ngo', 'admin'].includes(req.user.accessRole) &&
        String(request.reportedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'You do not have access to this distress request' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/distress/:id/status
 * @desc    Update status and append to timeline
 */
router.patch('/:id/status', allowRoles('ngo', 'admin'), async (req, res, next) => {
  try {
    const { status, notes, updatedBy, updaterName } = req.body;

    const request = await DistressRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Distress request not found' });
    }

    if (status) request.status = status;
    if (req.body.verificationNotes) request.verificationNotes = req.body.verificationNotes;

    // Append to timeline audit trail
    request.timeline.push({
      status: status || request.status,
      timestamp: new Date(),
      updatedBy: updatedBy || null,
      updaterName: updaterName || 'Disaster Control Room',
      notes: notes || `Status changed to ${status || request.status}`,
    });

    await request.save();

    // Broadcast update via Socket.io
    broadcastDistressEvent('distress:updated', request, request.location?.districtZone);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: request,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/distress/:id/assign
 * @desc    Assign distress request to a volunteer/NGO agent
 */
router.patch('/:id/assign', allowRoles('ngo', 'admin'), async (req, res, next) => {
  try {
    const { userId, updaterName, notes } = req.body;

    const request = await DistressRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Distress request not found' });
    }

    request.assignedTo = userId;
    request.status = 'Claimed';

    request.timeline.push({
      status: 'Claimed',
      timestamp: new Date(),
      updatedBy: userId,
      updaterName: updaterName || 'Field Agent Claimed',
      notes: notes || 'Assigned to field responder unit.',
    });

    await request.save();
    await request.populate('assignedTo', 'name email role organizationName phone');

    broadcastDistressEvent('distress:claimed', request, request.location?.districtZone);

    res.status(200).json({
      success: true,
      message: 'Request assigned to responder',
      data: request,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
