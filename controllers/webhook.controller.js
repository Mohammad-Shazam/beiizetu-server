//controllers/webhook.controller.js
const webhookService = require('../services/webhook.service');
const { successResponse } = require('../utils/helpers');

exports.handleWebhook = async (req, res) => {
  try {
    await webhookService.processWebhook(req.body);
    successResponse(res, 'Webhook processed successfully');
  } catch (error) {
    // Webhook processing errors should still return 200 to Swahilies
    console.error('Webhook processing error:', error);
    successResponse(res, 'Webhook received');
  }
};