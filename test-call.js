require('dotenv').config();
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function createCall() {
  try {
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+18327881895",
      url: "http://demo.twilio.com/docs/voice.xml",
    });
    console.log("Call created:", call.sid);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

createCall();