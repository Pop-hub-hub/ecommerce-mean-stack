const mongoose = require('mongoose');

const resetPasswordSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  resetCode: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  ResetCodeVerified: {
    type: Boolean,
    default: false
  }
});
const ResetPassword = mongoose.model('ResetPassword', resetPasswordSchema);
module.exports = ResetPassword