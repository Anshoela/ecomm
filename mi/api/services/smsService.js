import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Twilio client initialization
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send SMS function
const sendSMS = (to, body) => {
  client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
  .then((message) => console.log('SMS sent:', message.sid))
  .catch((error) => console.error('Error sending SMS:', error));
};

// Send low stock alert
const sendLowStockAlert = (adminPhone, product) => {
  const message = `Low stock alert: Product ${product.name} is running low (${product.stock_quantity} left). Update stock here: ${product.update_link}`;
  sendSMS(adminPhone, message);
};

// Export functions using ES6 syntax
export { sendLowStockAlert };
