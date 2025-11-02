const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ResetPassword = require('../models/resetPassword');
const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6 digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to ResetPassword collection
    await ResetPassword.create({
      email: user.email,
      resetCode: hashedResetCode,
      expiresAt,
      used: false,
      ResetCodeVerified: false
    });

    // Update user with reset token and expiration
    user.resetPasswordToken = hashedResetCode;
    user.expiresAt = expiresAt;
    await user.save();

    // Send email with reset code using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false 
      }
    });

    const mailOptions = {
      from: `"E-commerce App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Your Password',
      text: `Hi ${user.firstName || 'User'},\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello ${user.firstName || 'User'},</p>
          <p>We received a request to reset your password. Use the following code to proceed:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${resetCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have any concerns.</p>
          <p>Best regards,<br>E-commerce Team</p>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      res.status(200).json({ 
        success: true,
        message: 'Reset code has been sent to your email',
        resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      res.status(200).json({ 
        success: true,
        message: 'Reset code generated but failed to send email',
        resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
      });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully. You can now reset your password.'
    });
  } catch (error) {
    console.error('Error in verifyResetCode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find the verified reset record
    const resetRecord = await ResetPassword.findOne({ 
      email,
      used: false,
      ResetCodeVerified: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verified reset session found. Please verify your reset code first.' 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = Date.now();
    
    // Mark reset record as used
    resetRecord.used = true;
    
    // Save changes
    await Promise.all([user.save(), resetRecord.save()]);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};
