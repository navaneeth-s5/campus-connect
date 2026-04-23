const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

// Get tickets (all for admin/principal, own for students/faculty)
router.get('/', auth, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'admin' || req.user.role === 'principal') {
      tickets = await Ticket.find().populate('createdBy', 'name rollNumber college department').sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: req.user.id }).populate('createdBy', 'name rollNumber college department').sort({ createdAt: -1 });
    }
    
    // Check SLA Escalation (24h rule)
    const now = new Date();
    for (let t of tickets) {
      if (t.status === 'open' || t.status === 'in-progress') {
        const hoursSinceCreation = (now - new Date(t.createdAt)) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24 && !t.escalated) {
          t.escalated = true;
          await t.save();
        }
      }
    }
    
    res.json(tickets);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new ticket
router.post('/', auth, async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.json(ticket);
  } catch(e) {
    res.status(400).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket status & resolution
router.put('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'principal') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const updateData = { status: req.body.status };
    if (req.body.resolution) updateData.resolution = req.body.resolution;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(ticket);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a response to a ticket
router.post('/:id/responses', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.responses.push({
      message: req.body.message,
      senderRole: req.user.role,
      senderName: req.user.name
    });
    await ticket.save();
    res.json(ticket);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
