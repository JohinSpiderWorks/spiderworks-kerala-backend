
require('dotenv').config();
const { Op } = require('sequelize');
const addressModel = require('../../models/user/address.model');
const Product = require('../../models/products/product.model');
const AttributeValueProduct = require('../../models/products/product_variants.model');
const cart = require('../../models/products/cart');
const order = require('../../models/products/order');
const Product_Category = require('../../models/products/category.model');
const GalleryMedia = require('../../models/GalleryMedia');
const CategoryItem = require('../../models/products/category_items.model');
const Order = require('../../models/products/order');
const Cart = require('../../models/products/cart');
const OrderItem = require('../../models/products/order_items.model');

const Stripe = require('stripe');
const Payment = require('../../models/products/payment.model');
const sequelize = require('../../config/sequelize.config');

// Initialize Stripe with secret key from environment variables
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY);





// Get product list with pagination and filtering
const getProductList = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (category) where.category_id = category;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const products = await Product.findAndCountAll({
      where,
      include: [{
        model: GalleryMedia,
        as: 'featured_image'
      }, {
        model: GalleryMedia,
        as: 'banner_image'
      }, {
        model: AttributeValueProduct,
        as: 'variants',
        include: [
          {
            model: CategoryItem,
            as: 'category_item_1'
          },
          {
            model: CategoryItem,
            as: 'category_item_2'
          },
          {
            model: CategoryItem,
            as: 'category_item_3'
          }
        ]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: products.rows,
      total: products.count,
      page: parseInt(page),
      totalPages: Math.ceil(products.count / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get product details with variants
const getProductDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      where: { slug: slug },
      include: [
        {
          model: AttributeValueProduct,
          as: 'variants',
          include: [{
            model: CategoryItem,
            as: 'category_item_1',
            include: [{
              model: GalleryMedia,
              as: 'items_icon'
            }]
          }, {
            model: CategoryItem,
            as: 'category_item_2',
            include: [{
              model: GalleryMedia,
              as: 'items_icon'
            }]

          }, {
            model: CategoryItem,
            as: 'category_item_3',
            include: [{
              model: GalleryMedia,
              as: 'items_icon'
            }]
          }]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add to cart (create order)
const addToCart = async (req, res) => {
  try {
    const { product_variant_id, quantity } = req.body;
    const user_id = req.user.id;

    // Input validation
    if (!product_variant_id) {
      return res.status(400).json({ success: false, message: 'Product variant ID is required' });
    }
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive integer quantity is required' });
    }

    // Fetch product variant
    const variant = await AttributeValueProduct.findByPk(product_variant_id);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found' });
    }

    // Check stock availability
    if (quantity > variant.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${quantity}) exceeds available stock (${variant.stock})`,
      });
    }

    // Check if item already exists in cart
    let cartItem = await Cart.findOne({
      where: { user_id, product_variant_id },
    });

    const total_amount = variant.price * quantity;

    if (cartItem) {
      // Update existing cart item
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Total quantity (${newQuantity}) exceeds available stock (${variant.stock})`,
        });
      }
      cartItem.quantity = newQuantity;
      cartItem.total_price = variant.price * newQuantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        user_id,
        product_variant_id,
        quantity,
        price: variant.price,
        total_price: total_amount,
      });
    }

    res.status(201).json({ success: true, data: cartItem });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// View user orders
const cartList = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch cart items with pagination
    const { count, rows: cartItems } = await Cart.findAndCountAll({
      where: { user_id },
      include: [
        {
          model: AttributeValueProduct,
          as: 'product_cart_variant',
          include: [
            { model: CategoryItem, as: 'category_item_1' },
            { model: CategoryItem, as: 'category_item_2' },
            { model: CategoryItem, as: 'category_item_3' },
            { model: GalleryMedia, as: 'variant_image' },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Fetch sum of total_price

    const totalCartAmount = cartItems.reduce((total, item) => {
      const variantPrice = item.product_cart_variant?.price || 0;
      return total + (variantPrice * item.quantity);
    }, 0);

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: cartItems,
      meta: {
        total: count,
        page,
        limit,
        total_pages: totalPages,
        total_cart_amount: totalCartAmount || 0, // Handle null case
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Find the cart item to ensure it belongs to the user
    const cartItem = await Cart.findOne({
      where: {
        id,
        user_id
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or does not belong to user'
      });
    }

    // Delete the cart item
    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Cart item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const createOrder = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Check Stripe initialization
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    // Get user's primary address
    const primaryAddress = await addressModel.findOne({
      where: { user_id, is_primary: true },
    });

    if (!primaryAddress) {
      return res.status(404).json({
        success: false,
        message: 'Primary address not found. Please set a primary address.',
      });
    }

    // Get user's cart items
    const cartItems = await Cart.findAll({
      where: { user_id },
      include: [{
        model: AttributeValueProduct,
        as: 'product_cart_variant',
        include: [{
          model: Product,
          as: 'product'
        }, {
          model: CategoryItem,
          as: 'category_item_1'
        }, {
          model: CategoryItem,
          as: 'category_item_2'
        }, {
          model: CategoryItem,
          as: 'category_item_3'
        }]
      }],
    });




    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart is empty' });
    }

    // Validate product variants
    for (const item of cartItems) {
      if (!item.product_cart_variant || !item.product_cart_variant.price) {
        throw new Error(`Invalid product variant for cart item ${item.id}`);
      }
    }

    // Calculate total amount using the same method as cartList
    const totalAmount = cartItems.reduce((total, item) => {
      const variantPrice = item.product_cart_variant?.price || 0;
      return total + (variantPrice * item.quantity);
    }, 0);

    // Validate against stored total_price
    const totalCartAmount = await Cart.sum('total_price', { where: { user_id } });
    console.log({ totalAmount, totalCartAmount });

    if (totalCartAmount !== totalAmount) {
      throw new Error('Cart total mismatch. Please refresh cart.');
    }

    // Create order and order items in a transaction
    const order = await sequelize.transaction(async (t) => {
      const newOrder = await Order.create({
        user_id,
        address_id: primaryAddress.id,
        total_amount: totalAmount,
        status: 'Pending',
      }, { transaction: t });

      // Create order items
      for (const item of cartItems) {
        await OrderItem.create({
          user_id,
          order_id: newOrder.id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          price_at_purchase: item.product_cart_variant.price,
        }, { transaction: t });
      }


      return newOrder;
    });



    // Create Stripe Checkout Session
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: process.env.CURRENCY || 'aed',
        product_data: {
          name: `${item?.product_cart_variant?.product?.title}${item.product_cart_variant?.category_item_1?.label ? ` - ${item.product_cart_variant.category_item_1.label}` : ''}${item.product_cart_variant?.category_item_2?.label ? ` - ${item.product_cart_variant.category_item_2.label}` : ''}${item.product_cart_variant?.category_item_3?.label ? ` - ${item.product_cart_variant.category_item_3.label}` : ''}`,
        },
        unit_amount: Math.round(item.product_cart_variant.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        order_id: order.id.toString(),
        user_id: user_id.toString(),
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id
        }
      }
    });


     await Payment.create({
      order_id: parseInt(session?.metadata?.order_id),
      status: 'pending',
      amount: session?.amount_subtotal?.toFixed(2),
      currency: session?.currency,

    })

    // Note: Cart is NOT cleared here. It should be cleared in a Stripe webhook after payment confirmation.

    res.status(201).json({
      success: true,
      message: 'Order created. Redirecting to payment.',
      data: {
        order,
        checkout: session,

      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Webhook endpoint for Stripe payment events
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log(sig, endpointSecret);


  console.log(req.body);


  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check for duplicate event using event.id (idempotency)


  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      try {
        // Fetch the latest session details securely
        const fullSession = await stripe.checkout.sessions.retrieve(session.id);

        if (fullSession.payment_status !== 'paid') {
          console.error('Payment status is not paid.');
          return res.status(400).send('Invalid payment status.');
        }

        const orderId = fullSession.metadata?.order_id;
        const customerEmail = fullSession.customer_details?.email;

        if (!orderId || !customerEmail) {
          console.error('Missing metadata or customer email.');
          return res.status(400).send('Missing metadata.');
        }

        const order = await Order.findByPk(orderId);
        if (!order) {
          console.error('Order not found.');
          return res.status(404).send('Order not found.');
        }

        // Optional: Validate that the email in the session matches the order's user
        if (order.customer_email && order.customer_email !== customerEmail) {
          console.error('Order email mismatch.');
          return res.status(403).send('Unauthorized order access.');
        }

        // Mark order as processing
        await order.update({ status: 'Processing' });

        // Save payment
        await Payment.create({
          order_id: order.id,
          payment_method: fullSession.payment_method_types[0],
          transaction_id: fullSession.payment_intent,
          amount: fullSession.amount_total / 100,
          status: 'completed'
        });

        console.log(`Payment recorded for order ${orderId}`);
      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).send('Internal Server Error');
      }
      break;

    case 'checkout.session.async_payment_failed':
      const failedSession = event.data.object;
      try {
        const orderId = failedSession.metadata?.order_id;
        if (orderId) {
          await Order.update({ status: 'Cancelled' }, { where: { id: orderId } });
          console.log(`Payment failed for order ${orderId}`);
        }
      } catch (error) {
        console.error('Error updating failed payment:', error);
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};



// View user orders
const viewOrders = async (req, res) => {
  try {
    console.log('view order');

    const user_id = req.user.id;
    const orders = await OrderItem.findAll({
      where: { user_id },
      include: [
        {
          model: AttributeValueProduct,
          as: 'product_order_variant',
          include: [{
            model: GalleryMedia,
            as: 'variant_image'
          }]
        },
        // {
        //   model: Payment,
        //   as: 'payments',
        //   attributes: ['transaction_id', 'payment_method', 'amount', 'status', 'created_at']
        // }
      ],
      order: [
        ['created_at', 'DESC'],
        // [{model: Payment, as: 'payments'}, 'created_at', 'DESC']
      ]
    });

    console.log({ orders: orders[0] });




    // Format response with order and payment details
    const formattedOrders = orders.map(order => ({
      ...order.toJSON(),
      quantity: order.dataValues.quantity,
      price_at_purchase: order.dataValues.price_at_purchase,
      total_amount: order.dataValues.quantity * parseFloat(order.dataValues.price_at_purchase),
    }));

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProductList,
  getProductDetail,
  addToCart,
  viewOrders,
  createOrder,
  cartList,
  deleteCartItem,
  stripeWebhook
};
