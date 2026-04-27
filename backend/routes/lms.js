const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const Module = require('../models/Module');
const LMSAnalytics = require('../models/LMSAnalytics');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');

const LMSTask = require('../models/LMSTask');
const LMSSubmission = require('../models/LMSSubmission');

// --- Course Management ---

// Get all courses (Public for signup)
router.get('/public/courses', async (req, res) => {
  try {
    const courses = await Course.find().select('title department _id code');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get courses for current user
router.get('/courses', auth, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await Course.find().populate('faculty', 'name').populate('students', 'name rollNumber');
    } else if (req.user.role === 'faculty') {
      courses = await Course.find({ faculty: req.user.id }).populate('students', 'name rollNumber');
    } else {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      courses = await Course.find({ 
        $or: [{ department: user.department }, { students: req.user.id }]
      }).populate('faculty', 'name');
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single course details
router.get('/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name rollNumber department')
      .populate('students', 'name rollNumber department');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll Student in Course (Faculty/Admin)
router.post('/courses/:id/enroll', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { studentRollNumber } = req.body;
  try {
    const student = await User.findOne({ rollNumber: studentRollNumber, role: 'student' });
    if (!student) return res.status(404).json({ error: 'Student not found with this roll number' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.students.includes(student._id)) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    course.students.push(student._id);
    await course.save();
    res.json({ success: true, student: { name: student.name, rollNumber: student.rollNumber } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course (Admin)
router.post('/courses', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { title, code, description, department, facultyId } = req.body;
  try {
    const course = new Course({ title, code, description, department, faculty: facultyId });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update course (Admin)
router.put('/courses/:id', auth, async (req, res) => {
  console.log('PUT /courses/' + req.params.id, req.body);
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { title, code, description, department, facultyId } = req.body;
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id, 
      { title, code, description, department, faculty: facultyId },
      { new: true }
    );
    console.log('Update result:', course);
    res.json(course);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course (Admin)
router.delete('/courses/:id', auth, async (req, res) => {
  console.log('DELETE /courses/' + req.params.id);
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const result = await Course.findByIdAndDelete(req.params.id);
    console.log('Delete result:', result);
    // Optionally delete modules as well
    await Module.deleteMany({ courseId: req.params.id });
    await LMSTask.deleteMany({ courseId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Task Management ---

// Get tasks for a course
router.get('/courses/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await LMSTask.find({ courseId: req.params.id }).sort('-createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task (Faculty/Admin)
router.post('/courses/:id/tasks', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { title, description, deadline, materials } = req.body;
  try {
    const task = new LMSTask({ 
      courseId: req.params.id, 
      facultyId: req.user.id,
      title, 
      description, 
      deadline, 
      materials 
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit task (Student)
router.post('/tasks/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can submit' });
  const { fileUrl, fileName } = req.body;
  try {
    const submission = new LMSSubmission({
      taskId: req.params.id,
      studentId: req.user.id,
      fileUrl,
      fileName
    });
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get submissions for a task (Faculty/Admin)
router.get('/tasks/:id/submissions', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const submissions = await LMSSubmission.find({ taskId: req.params.id }).populate('studentId', 'name rollNumber');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Module Management ---

// Get modules for a course
router.get('/courses/:id/modules', auth, async (req, res) => {
  try {
    const modules = await Module.find({ courseId: req.params.id }).sort('order');
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create module (Faculty/Admin)
router.post('/courses/:id/modules', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { title, order, isLocked, prerequisiteModule } = req.body;
  try {
    const module = new Module({ 
      courseId: req.params.id, 
      title, 
      order, 
      isLocked, 
      prerequisiteModule 
    });
    await module.save();
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add content to module
router.post('/modules/:id/content', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    
    module.content.push(req.body); // { type, title, url, body, quizData }
    await module.save();
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Analytics & Tracking ---

// Update progress (Student)
router.post('/progress/:courseId', auth, async (req, res) => {
  const { contentId, type, score, totalPoints } = req.body;
  try {
    let analytics = await LMSAnalytics.findOne({ userId: req.user.id, courseId: req.params.courseId });
    if (!analytics) {
      analytics = new LMSAnalytics({ userId: req.user.id, courseId: req.params.courseId });
    }

    if (contentId && !analytics.completedContentIds.includes(contentId)) {
      analytics.completedContentIds.push(contentId);
    }

    if (type === 'quiz') {
      analytics.quizScores.push({ score, totalPoints });
    }

    analytics.lastActivity = Date.now();
    
    // Early Warning System Logic
    const hasLowAttendance = analytics.attendancePercentage < 75;
    const hasNoSubmissions = analytics.quizScores.length === 0;
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    if (hasLowAttendance && hasNoSubmissions && analytics.lastActivity < twoWeeksAgo) {
      analytics.isAtRisk = true;
    } else {
      analytics.isAtRisk = false;
    }

    await analytics.save();
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student analytics (Faculty)
router.post('/courses/:courseId/students/:studentId/analytics', auth, async (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { attendancePercentage } = req.body;
  try {
    let analytics = await LMSAnalytics.findOne({ userId: req.params.studentId, courseId: req.params.courseId });
    if (!analytics) {
      analytics = new LMSAnalytics({ userId: req.params.studentId, courseId: req.params.courseId });
    }
    
    if (attendancePercentage !== undefined) {
      analytics.attendancePercentage = attendancePercentage;
    }
    
    await analytics.save();
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Get analytics (Faculty/Admin for course, Student for self)
router.get('/analytics/:courseId', auth, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const analytics = await LMSAnalytics.findOne({ userId: req.user.id, courseId: req.params.courseId });
      return res.json(analytics);
    }
    
    const analytics = await LMSAnalytics.find({ courseId: req.params.courseId }).populate('userId', 'name rollNumber');
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
