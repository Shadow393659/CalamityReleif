const express = require('express');
const router = express.Router();
const ResourceInventory = require('../models/ResourceInventory');
const { getIO } = require('../sockets/socketHandler');
const { allowRoles, requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.use(allowRoles('ngo', 'admin'));

/**
 * @route   GET /api/inventory
 * @desc    Fetch disaster resource inventories with optional filter by itemType, org, or district
 */
router.get('/', async (req, res, next) => {
  try {
    const { itemType, managedByOrg, districtZone } = req.query;

    const filter = {};
    if (itemType) filter.itemType = itemType;
    if (managedByOrg) filter.managedByOrg = new RegExp(managedByOrg, 'i');
    if (districtZone) filter['warehouseLocation.districtZone'] = new RegExp(districtZone, 'i');

    const inventory = await ResourceInventory.find(filter).sort({ itemType: 1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/inventory
 * @desc    Add new stock to inventory
 */
router.post('/', allowRoles('admin'), async (req, res, next) => {
  try {
    const item = await ResourceInventory.create(req.body);

    const io = getIO();
    if (io) {
      io.to('operations').emit('inventory:created', item);
    }

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/inventory/:id/dispatch
 * @desc    Allocate / dispatch inventory quantity
 */
router.patch('/:id/dispatch', allowRoles('admin'), async (req, res, next) => {
  try {
    const { dispatchQuantity } = req.body;
    const item = await ResourceInventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory record not found' });
    }

    const qty = parseInt(dispatchQuantity) || 0;
    if (qty > item.availableQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient inventory: requested ${qty}, available ${item.availableQuantity}`,
      });
    }

    item.allocatedQuantity = (item.allocatedQuantity || 0) + qty;
    item.availableQuantity = item.totalQuantity - item.allocatedQuantity;
    item.lastUpdated = new Date();

    await item.save();

    const io = getIO();
    if (io) {
      io.to('operations').emit('inventory:updated', item);
    }

    res.status(200).json({
      success: true,
      message: 'Resources allocated successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
