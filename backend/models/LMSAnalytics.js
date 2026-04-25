const mongoose = require('mongoose');

const lmsAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  attendancePercentage: { type: Number, default: 0 },
  contentCompletion: { type: Number, default: 0 }, // percentage of modules/content completed
  completedContentIds: [{ type: String }], // tracking individual IDs
  quizScores: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    contentIndex: Number,
    score: Number,
    totalPoints: Number,
    date: { type: Date, default: Date.now }
  }],
  lastActivity: { type: Date, default: Date.now },
  isAtRisk: { type: Boolean, default: false }
});

lmsAnalyticsSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('LMSAnalytics', lmsAnalyticsSchema);
