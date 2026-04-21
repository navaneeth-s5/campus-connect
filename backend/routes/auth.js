const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, rollNumber: user.rollNumber, college: user.college, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '7d' }
  );
};

// Seed admin/principal on start
const seedDefaults = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  if (!(await User.findOne({ rollNumber: 'admin' }))) {
    await User.create({
      name: 'Administrator', college: 'Global', rollNumber: 'admin',
      department: 'Admin', course: 'Admin', password: hashedPassword, role: 'admin'
    });
  }
  if (!(await User.findOne({ rollNumber: 'principal' }))) {
    await User.create({
      name: 'Principal', college: 'Global', rollNumber: 'principal',
      department: 'Executive', course: 'Executive', password: hashedPassword, role: 'principal'
    });
  }
};
seedDefaults();

router.post('/signup', async (req, res) => {
  const { name, college, rollNumber, department, course, password, role } = req.body;
  if (!name || !college || !rollNumber || !department || !course || !password || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (role === 'admin' || role === 'principal') {
    return res.status(400).json({ error: `Cannot register as ${role}` });
  }

  try {
    const rollNumberLower = rollNumber.toLowerCase();
    let user = await User.findOne({ college, rollNumber: rollNumberLower });
    if (user) return res.status(400).json({ error: 'Username/Roll number already registered for this college' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, college, rollNumber: rollNumberLower, department, course, password: hashedPassword, role });
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, rollNumber: user.rollNumber, college: user.college, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ rollNumber: username.toLowerCase() });
    if (!user) {
       return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, rollNumber: user.rollNumber, college: user.college, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// Security Operations
router.post('/request-reset', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOneAndUpdate({ rollNumber: username.toLowerCase() }, { passwordResetRequested: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Server error' }) }
});

router.get('/reset-requests', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const reqs = await User.find({ passwordResetRequested: true }).select('name rollNumber college department');
  res.json(reqs);
});

router.post('/approve-reset', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { userId, newPassword } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await User.findByIdAndUpdate(userId, { password: hashedPassword, passwordResetRequested: false });
  res.json({ success: true });
});

module.exports = router;
