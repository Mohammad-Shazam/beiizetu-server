const swahilies = require('./services/swahilies.service');

async function testPayment() {
  try {
    console.log('Testing payment integration...');
    
    const result = await swahilies.initiateMobilePayment({
      amount: 1000, // Test with small amount
      phoneNumber: '255754808161', // Test number
      planName: 'Test Plan'
    });
    
    console.log('Payment initiated successfully:', result);
    
    // Check status after 5 seconds
    setTimeout(async () => {
      const status = await swahilies.checkOrderStatus(result.orderId);
      console.log('Payment status:', status);
    }, 5000);
    
  } catch (error) {
    console.error('Payment test failed:', error.message);
    process.exit(1);
  }
}

testPayment();