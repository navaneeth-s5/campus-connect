const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  isLocked: { type: Boolean, default: false },
  prerequisiteModule: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  content: [{
    type: { type: String, enum: ['video', 'pdf', 'note', 'quiz'], required: true },
    title: { type: String, required: true },
    url: { type: String }, // For video/pdf
    body: { type: String }, // For notes
    quizData: {
      questions: [{
        questionText: String,
        questionType: { type: String, enum: ['MCQ', 'Essay', 'Matching'] },
        options: [String],
        correctAnswer: mongoose.Schema.Types.Mixed,
        points: { type: Number, default: 1 }
      }],
      timeLimit: Number // in minutes
    }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Module', moduleSchema);
