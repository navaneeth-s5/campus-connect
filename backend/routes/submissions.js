const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Student submits a document
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can submit' });
  const { facultyId, title, description } = req.body;
  if (!facultyId || !title || !req.file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const submission = await Submission.create({
      student: req.user.id,
      faculty: facultyId,
      title,
      description,
      fileUrl: '/uploads/' + req.file.filename
    });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get submissions (for student or faculty)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'faculty') {
      query.faculty = req.user.id;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const submissions = await Submission.find(query)
      .populate('student', 'name rollNumber college department')
      .populate('faculty', 'name')
      .sort({ createdAt: -1 });
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
