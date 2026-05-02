const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  department: { type: String, required: true },
  isHOD: { type: Boolean, default: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  schedule: [{
    date: { type: String, required: true },
    slots: [{
      hour: { type: Number, required: true },
      replacementId: { type: String, ref: 'User' },
      replacementName: { type: String }
    }]
  }],
  status: { 
    type: String, 
    enum: ['pending_hod', 'pending_principal', 'approved', 'rejected', 'revoked'], 
    default: 'pending_hod' 
  },
  actingHODId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actingHODName: { type: String, default: null },
  college: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leave', leaveSchema);
