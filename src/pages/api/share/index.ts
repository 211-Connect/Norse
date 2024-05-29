import { NextApiHandler } from 'next';
import * as process from 'process';
import client from 'twilio';

const twilioClient = client(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const ShareHandler: NextApiHandler = async (req, res) => {
  if (TWILIO_PHONE_NUMBER == null) {
    res.statusCode = 404;
    res.send('Not found');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') res.redirect('/');
  if (req.method === 'POST') {
    const phoneNumber = req.body.phoneNumber;
    const body = req.body.message;
    const { errorMessage } = await twilioClient.messages.create({
      body: body,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    if (!errorMessage) {
      res.statusCode = 200;
      res.json({ message: 'Message sent!' });
    } else {
      res.statusCode = 500;
      res.json({ error: errorMessage });
    }
  } else {
    res.statusCode = 404;
    res.redirect('/404');
  }
};

export default ShareHandler;
