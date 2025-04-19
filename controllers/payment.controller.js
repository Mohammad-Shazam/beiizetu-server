// controllers/payment.controller.js
const paymentService = require('../services/payment.service');
const webhookService = require('../services/webhook.service');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { swahilies } = require('../config');

/**
 * Initiate a mobile money payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const initiateMobilePayment = async (req, res) => {
  const startTime = Date.now();
  try {
    const { amount, phoneNumber, planName } = req.body;
    const orderId = req.body.orderId || `order_${Date.now()}`;
    
    // Validate input - FIXED: Added missing parenthesis
    if (!amount || isNaN(amount)) {
      throw new Error('Valid amount is required');
    }
    if (!phoneNumber || !/^255\d{9}$/.test(phoneNumber)) {
      throw new Error('Valid Tanzanian phone number (255XXXXXXXXX) is required');
    }

    logger.info(`Initiating ${planName} payment`, {
      orderId,
      amount,
      phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2')
    });

    const paymentData = {
      amount: Number(amount),
      phoneNumber,
      orderId,
      planName,
      metadata: {
        userId: req.user?.id || 'guest',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        source: req.headers['origin'] || 'unknown'
      }
    };

    const result = await paymentService.initiateMobilePayment(paymentData);
    
    if (!result.success) {
      throw new Error(result.message || 'Payment initiation failed');
    }

    logger.info('Payment initiated successfully', {
      orderId,
      reference: result.reference,
      duration: `${Date.now() - startTime}ms`
    });

    return successResponse(res, 'Payment initiated successfully', {
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      orderId,
      amount: paymentData.amount,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Payment initiation failed', {
      error: error.message,
      stack: error.stack,
      body: { ...req.body, phoneNumber: req.body.phoneNumber ? '******' : 'missing' },
      duration: `${Date.now() - startTime}ms`
    });

    const statusCode = error.message.includes('required') ? 400 : 
                      error.message.includes('timeout') ? 504 : 500;
    return errorResponse(res, error.message, statusCode);
  }
};

/**
 * Check payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId || orderId.length < 5) {
      throw new Error('Valid order ID is required');
    }

    logger.info(`Checking status for order: ${orderId}`);

    const status = await paymentService.checkPaymentStatus(orderId);
    
    if (!status) {
      throw new Error('Payment status not found');
    }

    return successResponse(res, 'Payment status retrieved', {
      orderId,
      status: status.state || 'unknown',
      amount: status.amount || 0,
      currency: status.currency || 'TZS',
      lastUpdated: status.timestamp || new Date().toISOString(),
      reference: status.reference || null
    });

  } catch (error) {
    logger.error('Status check failed', {
      orderId: req.params.orderId,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error.message, statusCode);
  }
};

/**
 * Handle payment webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleWebhook = async (req, res) => {
  try {
    logger.info('Payment webhook received', {
      headers: req.headers,
      body: { ...req.body, sensitiveData: '***' }
    });

    const signature = req.headers['x-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', swahilies.secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!signature || !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      logger.warn('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature
      });
      return errorResponse(res, 'Invalid signature', 401);
    }

    await webhookService.processWebhook(req.body);
    
    return successResponse(res, 'Webhook processed');

  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error.message,
      stack: error.stack
    });
    
    return successResponse(res, 'Webhook received');
  }
};

module.exports = {
  initiateMobilePayment,
  checkPaymentStatus,
  handleWebhook
};