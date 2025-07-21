const bcrypt = require('bcrypt');
const validator = require('validator');

// Verify email format
const verifyEmail = (email, res) => {
  const isValid = validator.isEmail(email);
  if (!isValid) {
    return res.json({
      success: false,
      message: 'Email verification failed: Invalid email format',
      data: {
        email: email
      }
    });
  }
  return true;
};

// Check if password is strong
const isStrongPassword = (password,res) => {
  const isStrong = validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
  
  if (!isStrong) {
    return res.json({
      success: false,
      message: 'Password is not strong enough',
      requirements: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      }
    });
  }
  
  return true;
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  verifyEmail,
  isStrongPassword,
  hashPassword,
  verifyPassword
};
