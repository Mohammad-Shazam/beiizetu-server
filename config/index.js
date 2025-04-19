require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  swahilies: {
    apiKey: process.env.SWAHILIES_API_KEY,
    secretKey: process.env.SWAHILIES_SECRET_KEY,
    baseUrl: process.env.SWAHILIES_BASE_URL || 'https://swahiliesapi.invict.site',
    apiUrl: process.env.SWAHILIES_API_URL || 'https://swahiliesapi.invict.site/Api',
    codes: {
      mobileMoney: 104,
      cardPayment: 107,
      reconciliation: 103,
      orderStatus: 105
    }
  }
};