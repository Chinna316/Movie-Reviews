const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 72;

function sendAuthResponse(res, statusCode, user) {
  res.status(statusCode).json({
    token: generateToken(user._id.toString()),
    user: user.toSafeObject(),
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', 400);
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedName.length < 2) {
    throw new AppError('Name must be at least 2 characters long.', 400);
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError('Please enter a valid email address.', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      'Password must be 72 characters or fewer.',
      400,
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError('An account with that email already exists.', 409);
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
  });

  sendAuthResponse(res, 201, user);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError('Please enter a valid email address.', 400);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      'Password must be 72 characters or fewer.',
      400,
    );
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  sendAuthResponse(res, 200, user);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: req.user.toSafeObject(),
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
