//middleware/auth.js
const { swahilies } = require('../config');

exports.verifyWebhook = (req, res, next) => {
  const digestHeader = req.headers['digest'];
  const timestamp = req.body.timestamp;
  const serverIp = req.ip;
  
  const toDigest = `timestamp=${timestamp}&server_ip=${serverIp}&api_key=${swahilies.apiKey}`;
  const calculatedDigest = require('crypto')
    .createHmac('sha256', swahilies.secretKey)
    .update(toDigest)
    .digest('base64');
  
  if (digestHeader !== calculatedDigest) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
};