const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'IT' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responses: [{
    message: String,
    senderRole: String,
    senderName: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resolution: { type: String },
  escalated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
