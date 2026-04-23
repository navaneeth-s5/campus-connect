const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
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

router.post('/', auth, async (req, res) => {
  try {
    const { facility, date, startTime, endTime, purpose, reason, guestPhone, guestName } = req.body;
    
    // Global conflict check
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
      return res.status(400).json({ error: 'This facility is booked at this time across the campus.' });
    }

    const booking = new Booking({
      userId: req.user.id,
      userName: guestName || req.user.name,
      userRole: req.user.role,
      userCollege: req.user.college,
      guestPhone,
      facility,
      date,
      startTime,
      endTime,
      purpose,
      reason
    });

    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      if (facility === 'Principal Appointment') {
        io.to('principal').emit('new_appointment', { facility, userName: req.user.name });
      }
      io.emit('booking_update', { type: 'new' });
    }

    const obj = booking.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'principal') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const { status, approvedRoom, approvedTime, declineReason } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status, approvedRoom, approvedTime, declineReason }, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const io = req.app.get('io');
    if (io) io.emit('booking_update', { type: 'status_changed', bookingId: booking._id });

    const obj = booking.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'principal' && booking.userId.toString() !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    
    const io = req.app.get('io');
    if (io) io.emit('booking_update', { type: 'deleted' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
