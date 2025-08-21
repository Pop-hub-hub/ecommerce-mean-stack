const ResetPassword = require('../models/resetPassword');
const bcrypt = require('bcrypt');

const verifyResetCode = async (req, res, next) => {
  try {
    const { resetCode } = req.body;
    
    if (!resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Reset code is required'
      });
    }

    // Find any reset record with this code
    const resetRecord = await ResetPassword.findOne({
      used: false,
      ResetCodeVerified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code. Please request a new one.'
      });
    }

    // Verify the reset code
    const isCodeValid = await bcrypt.compare(resetCode, resetRecord.resetCode);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Please try again.'
      });
    }

    // Mark the code as verified
    resetRecord.ResetCodeVerified = true;
    await resetRecord.save();

    // Attach resetRecord to the request for use in the next middleware
    req.resetRecord = resetRecord;
    next();

  } catch (error) {
    console.error('Error in verifyResetCode middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = verifyResetCode;
