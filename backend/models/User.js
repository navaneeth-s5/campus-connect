const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  college: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  course: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin', 'principal', 'guest'], required: true },
  passwordResetRequested: { type: Boolean, default: false },
  isHOD: { type: Boolean, default: false },
  actingHODFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

userSchema.index({ college: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
