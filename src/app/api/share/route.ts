import { NextResponse } from 'next/server';
import client from 'twilio';

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

export async function POST(request: Request) {
  try {
    const twilioClient = client(
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY,
      {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
      },
    );

    const body = await request.json();
    const phoneNumber = body.phoneNumber;
    const message = body.message;

    const { errorMessage } = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    if (!errorMessage) {
      return NextResponse.json({ message: 'Message sent!' }, { status: 200 });
    } else {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
