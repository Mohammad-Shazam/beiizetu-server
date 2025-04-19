//utils/schemas.js
const Joi = require('joi');

module.exports = {
  paymentSchema: Joi.object({
    amount: Joi.number().min(100).required(),
    phoneNumber: Joi.string().regex(/^255\d{9}$/).required(),
    planName: Joi.string().valid('Free Posting', 'Standard Boost', 'Premium Boost').required(),
    orderId: Joi.string().optional(),
    metadata: Joi.object().optional()
  })
};