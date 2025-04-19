curl -X POST http://localhost:5000/api/payments/mobile-money \
-H "Content-Type: application/json" \
-d '{"amount":5000,"phoneNumber":"255783262616","planName":"Premium"}'