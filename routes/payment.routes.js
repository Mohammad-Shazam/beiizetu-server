//routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const validateRequest = require('../middlewares/validateRequest');
const { paymentSchema } = require('../utils/schemas');

router.post('/mobile-money', 
  validateRequest(paymentSchema),
  paymentController.initiateMobilePayment
);

router.get('/status/:orderId', 
  paymentController.checkPaymentStatus
);


// Add to your routes/payment.routes.js
router.get('/verify-config', (req, res) => {
  const { swahilies } = require('../config');
  res.json({
    apiKey: swahilies.apiKey ? '***configured***' : 'MISSING',
    secretKey: swahilies.secretKey ? '***configured***' : 'MISSING',
    apiUrl: swahilies.apiUrl || 'MISSING',
    env: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL
  });
});

module.exports = router;