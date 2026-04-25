const mongoose = require('mongoose');

const lmsSubmissionSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'LMSTask', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  grade: { type: Number },
  feedback: { type: String }
});

module.exports = mongoose.model('LMSSubmission', lmsSubmissionSchema);
