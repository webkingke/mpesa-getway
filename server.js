
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const shortcode = '857767'; // Your Paybill
const passkey = process.env.PASSKEY;
const callbackURL = 'https://webkingke.github.io/mpesa-getway/callback'; // Update when using ngrok

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;

// Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return res.data.access_token;
}

// STK Push Route
app.post('/api/stkpush', async (req, res) => {
  const { phone, amount } = req.body;
  const formattedPhone = phone.startsWith('254') ? phone : phone.replace(/^0/, '254');
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

  try {
    const accessToken = await getAccessToken();
    const mpesaRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackURL,
        AccountReference: 'MalindiOrphans',
        TransactionDesc: 'Donation'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json({ message: 'Payment request sent. Check your phone.' });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'Payment request failed.', error: err.response?.data });
  }
});

app.listen(PORT, () => console.log(`Server running on https://webkingke.github.io/mpesa-getway/:${PORT}`));
