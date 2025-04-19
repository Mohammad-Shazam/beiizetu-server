//routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { verifyWebhook } = require('../middlewares/auth');

router.post('/', 
  verifyWebhook,
  webhookController.handleWebhook
);

module.exports = router;