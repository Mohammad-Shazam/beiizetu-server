//service/payment.service.js
const swahiliesService = require('./swahilies.service');
const logger = require('../utils/logger');

exports.initiateMobilePayment = async (paymentData) => {
  try {
    logger.info('Initiating mobile payment', {
      orderId: paymentData.orderId,
      amount: paymentData.amount
    });

    // Add basic validation
    if (paymentData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const result = await swahiliesService.initiateMobilePayment(paymentData);
    
    if (!result?.success) {
      throw new Error(result?.message || 'Payment initiation failed');
    }

    return {
      orderId: paymentData.orderId,
      reference: result.reference,
      paymentUrl: result.paymentUrl,
      amount: paymentData.amount,
      status: 'pending'
    };
  } catch (error) {
    logger.error('Payment service error', {
      error: error.message,
      stack: error.stack
    });
    throw error; // Re-throw for controller to handle
  }
};