//utils/helpers.js
module.exports = {
  successResponse: (res, message, data = null) => {
    res.json({
      success: true,
      message,
      data
    });
  },
  
  errorResponse: (res, message, statusCode = 400) => {
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
};