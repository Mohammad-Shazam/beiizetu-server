//service/webhook.service.js
const logger = require('../utils/logger');

exports.processWebhook = async (webhookData) => {
  try {
    const { code, transaction_details, metadata } = webhookData;
    
    if (code === 200) {
      logger.info(`Payment successful for order: ${transaction_details.order_id}`);
      // TODO: Update your database with successful payment
    } else {
      logger.warn(`Payment failed for order: ${transaction_details.order_id}`);
      // TODO: Handle failed payment
    }
    
    return true;
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    throw error;
  }
};