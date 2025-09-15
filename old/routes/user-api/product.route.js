require('dotenv').config();
const express = require('express');
const {
  getProductList,
  getProductDetail,
  addToCart,
  viewOrders,
  createOrder,
  cartList,
  deleteCartItem
} = require('../../controller/user-api/product.controller');
const jwt=require('jsonwebtoken');

const router = express.Router();



const authenticateUser = async(req, res, next) => {
  console.log('inside the middleware');
  
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


router.use(authenticateUser);

// Get product list with pagination and filtering
router.get('/', getProductList);



// Add to cart (create order)
router.post('/cart', addToCart); 

// Delete Cart item
router.delete('/cart/:id',deleteCartItem)

// Create order from cart
router.post('/create-order', createOrder);

// View user orders
router.get('/view-orders', viewOrders);

// get cart list
router.get('/cart-list',cartList)

// Get product details with variants
router.get('/:slug', getProductDetail);



module.exports = router;
