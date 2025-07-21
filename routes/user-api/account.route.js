
require('dotenv').config();
const express = require('express');
const router = express.Router();
const accountController = require('../../controller/user-api/account.controller');
const jwt=require('jsonwebtoken')


// Import authentication middleware
const { verifyToken } = require('../../middleware/auth.middleware');

// Middleware to check Bearer token in header
const authenticateUser = async(req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log({authHeader,token});
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded =await jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    console.log(decoded);
    
    
    // Attach user to request object
    req.user = decoded;
    
    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};



// User registration routes
// Public routes (no authentication required)
router.post('/register', accountController.createUser);
router.post('/verify-otp', accountController.verifyOTPAndCreateAccount);
router.post('/login', accountController.loginUser);


// Protected routes (require authentication)
router.use('/address', authenticateUser);
router.post('/address', accountController.createAddress);
router.put('/address/:id', accountController.updateAddress);
router.delete('/address/:id', accountController.deleteAddress);
router.get('/address', accountController.listAddresses);
router.get('/address/:id', accountController.getAddressById);
router.put('/address/:id/primary', accountController.setPrimaryAddress);


module.exports = router;
