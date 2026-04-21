const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Get all bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    // Convert mongoose objects to plain objects and map _id to id
    const mappedBookings = bookings.map(b => {
      const obj = b.toObject();
      obj.id = obj._id.toString();
      delete obj._id;
      delete obj.__v;
      return obj;
    });
    res.json(mappedBookings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { facility, date, startTime, endTime, purpose, reason } = req.body;
    
    // Check conflicts
    const conflict = await Booking.findOne({
      facility,
      date,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ error: 'This slot conflicts with an existing booking' });
    }

    const booking = new Booking({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      facility,
      date,
      startTime,
      endTime,
      purpose,
      reason
    });

    await booking.save();
    const obj = booking.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update status (Admin only)
router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const obj = booking.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
