const axios = require('axios');
const { swahilies } = require('../config');
const logger = require('../utils/logger');
const crypto = require('crypto');

class SwahiliesService {
  constructor() {
    this.validateConfig();
    this.initializeAxios();
    this.setupRequestSigning();
  }

  /**
   * Validate required configuration
   * @throws {Error} If any required config is missing
   */
  validateConfig() {
    const requiredConfig = {
      apiKey: {
        value: swahilies.apiKey,
        error: 'API key is required'
      },
      secretKey: {
        value: swahilies.secretKey,
        error: 'Secret key is required'
      },
      apiUrl: {
        value: swahilies.apiUrl,
        error: 'API URL is required'
      },
      codes: {
        value: swahilies.codes,
        error: 'Payment codes configuration is required'
      }
    };

    const errors = Object.entries(requiredConfig)
      .filter(([_, config]) => !config.value)
      .map(([_, config]) => config.error);

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
  }

  /**
   * Initialize Axios instance with base configuration
   */
  initializeAxios() {
    this.axios = axios.create({
      baseURL: swahilies.apiUrl,
      timeout: 20000,
      maxContentLength: 1000000,
      maxBodyLength: 1000000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Setup request signing interceptor
   */
  setupRequestSigning() {
    this.axios.interceptors.request.use(config => {
      const timestamp = Date.now();
      const nonce = crypto.randomBytes(16).toString('hex');
      const signature = crypto
        .createHmac('sha256', swahilies.secretKey)
        .update(`${timestamp}${nonce}${swahilies.apiKey}`)
        .digest('hex');

      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Api-Key': swahilies.apiKey,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
          'X-Signature': signature
        }
      };
    });
  }

  /**
   * Initiate mobile money payment
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result
   */
  async initiateMobilePayment(paymentData) {
    try {
      this.validatePaymentData(paymentData);
      const payload = this.buildPaymentPayload(paymentData);
      
      logger.info('Initiating mobile payment', {
        orderId: payload.data.order_id,
        amount: payload.data.amount,
        maskedPhone: payload.data.phone_number.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2')
      });

      const response = await this.axios.post('', payload);
      return this.processPaymentResponse(response, payload.data.order_id);
      
    } catch (error) {
      const normalizedError = this.normalizeError(error);
      logger.error('Payment initiation failed', {
        error: normalizedError.message,
        stack: normalizedError.stack,
        response: error.response?.data
      });
      throw normalizedError;
    }
  }

  /**
   * Validate payment data
   * @param {Object} data - Payment data
   * @throws {Error} If validation fails
   */
  validatePaymentData(data) {
    const errors = [];
    
    if (!data?.amount || isNaN(data.amount) || data.amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (!data?.phoneNumber || !/^255\d{9}$/.test(data.phoneNumber)) {
      errors.push('Phone number must be in format 255XXXXXXXXX (12 digits total)');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid payment data: ${errors.join(', ')}`);
    }
  }

  /**
   * Build payment payload
   * @param {Object} data - Payment data
   * @returns {Object} Formatted payload
   */
  buildPaymentPayload(data) {
    return {
      api: 170,
      code: swahilies.codes.mobileMoney,
      data: {
        api_key: swahilies.apiKey,
        order_id: data.orderId || `order_${Date.now()}`,
        amount: Number(data.amount),
        phone_number: data.phoneNumber,
        is_live: process.env.NODE_ENV === 'production',
        webhook_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/webhook`,
        metadata: {
          ...(data.metadata || {}),
          source: 'nodejs-sdk',
          timestamp: new Date().toISOString(),
          ip: data.ip || 'unknown',
          userAgent: data.userAgent || 'unknown'
        }
      }
    };
  }

  /**
   * Process payment response
   * @param {Object} response - API response
   * @param {string} orderId - Order ID
   * @returns {Object} Processed response
   * @throws {Error} If response is invalid
   */
  processPaymentResponse(response, orderId) {
    if (!response?.data || typeof response.data !== 'object') {
      throw new Error('Invalid API response structure');
    }

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || `Payment failed with code ${response.data.code}`);
    }

    if (!response.data.transaction_details?.reference_id) {
      throw new Error('Missing transaction reference in response');
    }

    const result = {
      success: true,
      reference: response.data.transaction_details.reference_id,
      paymentUrl: response.data.transaction_details.payment_url,
      orderId,
      amount: response.data.amount,
      rawResponse: response.data
    };

    logger.info('Payment initiated successfully', {
      orderId,
      reference: result.reference,
      amount: result.amount
    });

    return result;
  }

  /**
   * Check order status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order status
   */
  async checkOrderStatus(orderId) {
    try {
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('Invalid order ID');
      }

      logger.debug('Checking order status', { orderId });

      const response = await this.axios.post('', {
        api: 170,
        code: swahilies.codes.orderStatus,
        data: {
          api_key: swahilies.apiKey,
          order_id: orderId
        }
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid status response format');
      }

      return {
        orderId,
        status: response.data.state || 'unknown',
        amount: response.data.amount || 0,
        currency: response.data.currency || 'TZS',
        timestamp: response.data.timestamp || new Date().toISOString(),
        reference: response.data.reference_id || null,
        rawResponse: response.data
      };

    } catch (error) {
      const normalizedError = this.normalizeError(error);
      logger.error('Order status check failed', {
        orderId,
        error: normalizedError.message,
        response: error.response?.data
      });
      throw normalizedError;
    }
  }

  /**
   * Normalize API errors
   * @param {Error} error - Original error
   * @returns {Error} Normalized error
   */
  normalizeError(error) {
    if (error.response) {
      return new Error(error.response.data?.msg || `API Error: ${error.response.status}`);
    }
    if (error.request) {
      return new Error('No response received from payment gateway');
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

module.exports = new SwahiliesService();