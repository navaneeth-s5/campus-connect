const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const auth = require('../middleware/auth');

// Seed default facilities if empty
const seedFacilities = async () => {
  const count = await Facility.countDocuments();
  if (count === 0) {
    const defaults = ["Lab 1", "Lab 2", "Lab 3", "Seminar Hall", "Principal Appointment"];
    for (const name of defaults) {
      await Facility.create({ name }).catch(() => {});
    }
  }
};
seedFacilities();

router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities.map(f => f.name));
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    await Facility.create({ name });
    res.json({ success: true });
  } catch(e) {
    res.status(400).json({ error: 'Facility might already exist' });
  }
});

module.exports = router;
