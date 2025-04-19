//routes/index.js
const express = require('express');
const router = express.Router();
const paymentRoutes = require('./payment.routes');
const webhookRoutes = require('./webhook.routes');

router.use('/payments', paymentRoutes);
router.use('/webhook', webhookRoutes);

module.exports = router;