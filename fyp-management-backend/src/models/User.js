const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, minlength: 60 },
  fullName: { type: String, required: true, maxlength: 255 },
  role: { type: String, enum: ['Student', 'Supervisor', 'Admin'], required: true },
  concentration: String,
  phone: String,
  officeHours: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deactivatedAt: Date,
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
