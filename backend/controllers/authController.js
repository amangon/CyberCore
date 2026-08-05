const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Register a new user
// Accepts: firstName, lastName, email, password, role
// Does NOT require an organization ObjectId - organization is optional and must be a valid ObjectId if provided
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return next(new ErrorResponse('Please provide firstName, lastName, email, and password', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists with this email', 400));
    }

    // Create user without organization — it is optional
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'viewer'
    });

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      accessToken: token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check account lockout BEFORE password comparison to avoid unnecessary bcrypt
    if (user.isLocked()) {
      return next(new ErrorResponse('Account temporarily locked due to too many failed attempts. Please try again later.', 423));
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Account is deactivated. Please contact your administrator.', 403));
    }

    // Successful login — reset failed attempts and update last login
    await user.resetLoginAttempts();

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = user.getSignedJwtToken();

    return res.status(200).json({
      success: true,
      // Return both `token` and `accessToken` so any client version works
      token: accessToken,
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organization: user.organization || null,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

// Logout user
exports.logout = (req, res, next) => {
  try {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Refresh access token using refresh token cookie
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies && req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new ErrorResponse('No refresh token provided', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new ErrorResponse('Invalid or expired refresh token', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new ErrorResponse('Unauthorized', 401));
    }

    const accessToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token: accessToken,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 regardless to prevent user enumeration
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://cybercore-frontend-vuje.onrender.com'}/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your SentinelX AI account.</p>
      <p>Click the link below to reset your password (expires in 1 hour):</p>
      <a href="${resetUrl}" style="background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({ email: user.email, subject: 'Password Reset Request', message });
      res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('organization', 'name industry');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile details
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {};
    if (req.body.firstName) fieldsToUpdate.firstName = req.body.firstName;
    if (req.body.lastName) fieldsToUpdate.lastName = req.body.lastName;
    if (req.body.email) fieldsToUpdate.email = req.body.email;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Update avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please provide an image file', 400));
    }

    // Upload to Cloudinary if configured
    let avatarUrl = null;
    const cloudinaryService = require('../services/cloudinaryService');

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await cloudinaryService.uploadFile(req.file.buffer, `avatar-${req.user.id}`);
      if (uploadResult && uploadResult.url) {
        avatarUrl = uploadResult.url;
      }
    }

    // If Cloudinary is not configured, use a local data URL
    if (!avatarUrl) {
      const base64 = req.file.buffer.toString('base64');
      avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
