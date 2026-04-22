const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const auth = require('../middleware/auth');

const mongoose = require('mongoose');

// Seed default facilities if empty
const seedFacilities = async () => {
  try {
    const count = await Facility.countDocuments();
    if (count === 0) {
      const defaults = ["Lab 1", "Lab 2", "Lab 3", "Seminar Hall", "Principal Appointment"];
      for (const name of defaults) {
        await Facility.create({ name, allowedRoles: ['student', 'faculty', 'principal', 'guest'] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

mongoose.connection.once('open', seedFacilities);

router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, allowedRoles } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    await Facility.create({ name, allowedRoles: allowedRoles || ['student', 'faculty', 'principal', 'guest'] });
    res.json({ success: true });
  } catch(e) {
    res.status(400).json({ error: 'Facility might already exist' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/assets', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    
    facility.assets.push(req.body);
    await facility.save();
    res.json(facility);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/assets/:assetId', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    
    facility.assets.pull({ _id: req.params.assetId });
    await facility.save();
    res.json(facility);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
