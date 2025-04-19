//config/index.js
const { swahilies } = require('./index');

module.exports = {
  apiKey: swahilies.apiKey,
  secretKey: swahilies.secretKey,
  baseUrl: swahilies.apiUrl,
  codes: {
    mobileMoney: 104,
    cardPayment: 107,
    reconciliation: 103,
    orderStatus: 105
  }
};