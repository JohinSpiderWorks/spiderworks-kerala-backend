require('dotenv').config();
const sequelize = require('../config/sequelize.config');
const Cart = require('../models/products/cart');
const Order = require("../models/products/order");
const OrderItem = require('../models/products/order_items.model');
const Payment = require("../models/products/payment.model");
const Stripe = require('stripe');
const AttributeValueProduct = require('../models/products/product_variants.model');
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY);

/**
 * Handle checkout.session.completed event
 * @param {Object} session - The Stripe session object
 */
async function handleCheckoutSessionCompleted(session) {
    console.log(`Processing checkout.session.completed for session ${session.id}`);

    try {
        // Retrieve the full session data to get all details
        const fullSession = await stripe.checkout.sessions.retrieve(session.id);

        if (fullSession.payment_status !== 'paid') {
            console.warn(`Session ${session.id} is not paid yet. Status: ${fullSession.payment_status}`);
            throw { message: 'Payment not completed', shouldRetry: false };
        }

        const orderId = fullSession.metadata?.order_id;
        const customerEmail = fullSession.customer_details?.email;

        if (!orderId) {
            console.error(`Missing order_id in metadata for session ${session.id}`);
            throw { message: 'Missing order_id in metadata', shouldRetry: false };
        }

        if (!customerEmail) {
            console.warn(`Missing customer email for session ${session.id}`);
            // Continue processing as this might not be critical
        }

        // Find the order in the database
        const order = await Order.findByPk(orderId, {
            include: [{
                model: OrderItem,
                as: 'order_items',
                include: [{
                    model: AttributeValueProduct,
                    as: 'product_order_variant'
                }]
            }]
        });
        
        if (!order) {
            console.error(`Order ${orderId} not found in database`);
            throw { message: 'Order not found', shouldRetry: true }; // Retry as the order might appear later
        }

        // Verify customer email if available
        if (customerEmail && order.customer_email && order.customer_email !== customerEmail) {
            console.error(`Email mismatch for order ${orderId}. Expected: ${order.customer_email}, Got: ${customerEmail}`);
            throw { message: 'Unauthorized', shouldRetry: false };
        }

        // Update order status with a transaction to ensure data consistency
        await sequelize.transaction(async (t) => {
            // Update order status
            await order.update({
                status: 'Processing',
                processed_at: new Date()
            }, { transaction: t });

            // Record payment details
            await Payment.create({
                order_id: order.id,
                payment_method: fullSession.payment_method_types[0],
                transaction_id: fullSession.payment_intent,
                amount: fullSession.amount_total / 100,
                currency: fullSession.currency,
                status: 'completed',
                metadata: JSON.stringify(fullSession.metadata)
            }, { transaction: t });

            // Update stock for each product variant in the order
            for (const item of order.order_items) {
                const variant = item.product_order_variant;
                if (variant) {
                    const newStock = variant.stock - item.quantity;
                    if (newStock < 0) {
                        throw new Error(`Insufficient stock for variant ${variant.id}`);
                    }
                    await variant.update({ stock: newStock }, { transaction: t });
                }
            }

            // Remove items from user's cart
            await Cart.destroy({
                where: { user_id: order.user_id },
                transaction: t
            });
        });

        console.log(`✅ Payment recorded for order ${orderId}`);
        console.log(`✅ Stock updated and cart cleared for user ${order.user_id}`);

    } catch (error) {
        console.error('Error processing checkout.session.completed:', error);
        throw error; // Re-throw to be handled by the main handler
    }
}

/**
 * Handle checkout.session.async_payment_failed event
 * @param {Object} session - The Stripe session object
 */
async function handleAsyncPaymentFailed(session) {
    console.log(`Processing checkout.session.async_payment_failed for session ${session.id}`);

    try {
        const orderId = session.metadata?.order_id;
        if (!orderId) {
            console.error(`Missing order_id in metadata for failed payment session ${session.id}`);
            return; // Don't throw as we can't do much without an order ID
        }

        // Find the order
        const order = await Order.findByPk(orderId);
        if (!order) {
            console.error(`Order ${orderId} not found for failed payment`);
            return;
        }

        // Update order status
        await order.update({
            status: 'Payment Failed',
            notes: order.notes ? `${order.notes}\nPayment failed on ${new Date().toISOString()}` : `Payment failed on ${new Date().toISOString()}`
        });

        console.log(`❌ Payment failed for order ${orderId}`);

        // Here you could add:
        // - Send notification to customer
        // - Send alert to support team
    } catch (error) {
        console.error('Error processing checkout.session.async_payment_failed:', error);
        // We don't re-throw here as we don't want to retry failed payment processing
    }
}

/**
 * Handle charge.succeeded event
 * @param {Object} charge - The Stripe charge object
 */
async function handleChargeSucceeded(charge) {
    console.log(`Processing charge.succeeded for charge ${charge.id}`);
    console.log({ charge });
    console.log({ charge: charge.payment_intent });

    try {
        const paymentIntent = charge.payment_intent;
        if (!paymentIntent) {
            console.log('Charge has no associated payment intent, skipping');
            return;
        }

        // Look up the payment in database
        const payment = await Payment.findOne({
            where: { order_id: parseInt(charge?.metadata?.order_id) }
        });

        if (!payment) {
            console.log(`No payment record found for payment intent ${paymentIntent}`);
            return;
        }

        // Update payment status based on charge status
        const newStatus = charge.status === 'succeeded' ? 'completed' : charge.status;

        if (payment.status !== newStatus) {
            await payment.update({
                status: newStatus,
                payment_method: charge?.payment_method_details?.type,
                currency: charge?.presentment_details?.presentment_currency,
                amount: charge?.presentment_details?.presentment_amount?.toFixed(2),
                updated_at: new Date()
            });
            console.log(`Updated payment status to ${newStatus} for order ${payment.order_id}`);
        }

        // Update order status based on charge status
        switch (charge.status) {
            case 'completed':
                await Order.update(
                    { status: 'Processing', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Processing for order ${payment.order_id}`);
                break;

            case 'failed':
                await Order.update(
                    { status: 'Cancelled', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Cancelled for order ${payment.order_id}`);
                break;

            case 'pending':
                await Order.update(
                    { status: 'Pending', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Pending for order ${payment.order_id}`);
                break;

            default:
                console.log(`No order status update needed for charge status: ${charge.status}`);
        }
    } catch (error) {
        console.error('Error processing charge.succeeded:', error);
        // Typically don't need to retry these updates
    }
}

/**
 * Handle charge.updated event
 * @param {Object} charge - The Stripe charge object
 */
async function handleChargeUpdated(charge) {
    console.log(`Processing charge.updated for charge ${charge.id}`);
    console.log({ charge });
    console.log({ charge: charge.payment_intent });

    try {
        const paymentIntent = charge.payment_intent;
        if (!paymentIntent) {
            console.log('Charge has no associated payment intent, skipping');
            return;
        }

        // Look up the payment in database
        const payment = await Payment.findOne({
            where: { order_id: parseInt(charge?.metadata?.order_id) }
        });

        if (!payment) {
            console.log(`No payment record found for payment intent ${paymentIntent}`);
            return;
        }

        // Update payment status based on charge status
        const newStatus = charge.status === 'succeeded' ? 'completed' : charge.status;

        if (payment.status !== newStatus) {
            await payment.update({
                status: newStatus,
                payment_method: charge?.payment_method_details?.type,
                currency: charge?.presentment_details?.presentment_currency,
                amount: charge?.presentment_details?.presentment_amount?.toFixed(2),

                updated_at: new Date()
            });
            console.log(`Updated payment status to ${newStatus} for order ${payment.order_id}`);
        }

        // Update order status based on charge status
        switch (charge.status) {
            case 'completed':
                await Order.update(
                    { status: 'Processing', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Processing for order ${payment.order_id}`);


                // Get all order items for this order
                const orderItems = await OrderItem.findAll({
                    where: { order_id: payment.order_id }
                });

                // Reduce stock for each product variant in the order
                for (const item of orderItems) {
                    const variant = await AttributeValueProduct.findByPk(item.product_variant_id);
                    if (variant) {
                        const newStock = variant.stock - item.quantity;
                        await variant.update({ stock: Math.max(newStock, 0) });
                        console.log(`Reduced stock for variant ${item.product_variant_id} by ${item.quantity}`);
                    }
                }

                // Get user ID from the order
                const order = await Order.findByPk(payment.order_id);
                if (order) {
                    // Remove all cart items for this user
                    await Cart.destroy({
                        where: { user_id: order.user_id }
                    });
                    console.log(`Removed all cart items for user ${order.user_id}`);
                }

                break;

            case 'succeeded':
                await Order.update(
                    { status: 'Processing', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Processing for order ${payment.order_id}`);


                // Get all order items for this order
                const orderItem = await OrderItem.findAll({
                    where: { order_id: payment.order_id }
                });

                // Reduce stock for each product variant in the order
                for (const item of orderItem) {
                    const variant = await AttributeValueProduct.findByPk(item.product_variant_id);
                    if (variant) {
                        const newStock = variant.stock - item.quantity;
                        await variant.update({ stock: Math.max(newStock, 0) });
                        console.log(`Reduced stock for variant ${item.product_variant_id} by ${item.quantity}`);
                    }
                }

                // Get user ID from the order
                const orders = await Order.findByPk(payment.order_id);
                if (orders) {
                    // Remove all cart items for this user
                    await Cart.destroy({
                        where: { user_id: orders.user_id }
                    });
                    console.log(`Removed all cart items for user ${orders.user_id}`);
                }

                break;

            case 'failed':
                await Order.update(
                    { status: 'Cancelled', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Cancelled for order ${payment.order_id}`);
                break;

            case 'pending':
                await Order.update(
                    { status: 'Pending', payment_id: payment?.id },
                    { where: { id: payment.order_id } }
                );
                console.log(`Updated order status to Pending for order ${payment.order_id}`);
                break;

            default:
                console.log(`No order status update needed for charge status: ${charge.status}`);
        }
    } catch (error) {
        console.error('Error processing charge.updated:', error);
        // Typically don't need to retry these updates
    }
}


module.exports = {
    handleAsyncPaymentFailed,
    handleChargeSucceeded,
    handleChargeUpdated,
    handleCheckoutSessionCompleted
}