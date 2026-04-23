const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  userCollege: { type: String, required: true },
  guestPhone: { type: String },
  facility: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  purpose: { type: String, required: true },
  reason: { type: String }, // optional, for principal appointment
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedRoom: { type: String }, // Scheduled by principal
  approvedTime: { type: String }, // Scheduled by principal
  declineReason: { type: String }, // Required when principal rejects
  createdAt: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.model('Booking', bookingSchema);
