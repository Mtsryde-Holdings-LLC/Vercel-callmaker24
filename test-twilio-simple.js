require('dotenv').config();

console.log('SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('Token:', process.env.TWILIO_AUTH_TOKEN ? 'Found' : 'Missing');
console.log('Phone:', process.env.TWILIO_PHONE_NUMBER);