import { findByTenantId } from '@/payload/collections/Tenants/services/findByTenantId';
import config from '@/payload/payload-config';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import client from 'twilio';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId?: string }> },
) {
  try {
    const { tenantId } = await params;
    const payload = await getPayload({ config });
    const tenant = await findByTenantId(payload, tenantId ?? '');

    const { accountSid, apiKey, apiKeySid, phoneNumber } = tenant?.twilio ?? {};

    if (!accountSid || !apiKey || !apiKeySid || !phoneNumber) {
      return NextResponse.json(
        { error: 'Twilio is not configured for this tenant' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const toPhoneNumber = body.phoneNumber;
    const message = body.message;

    const twilioClient = client(apiKeySid, apiKey, {
      accountSid,
    });

    const { errorMessage } = await twilioClient.messages.create({
      body: message,
      from: phoneNumber,
      to: toPhoneNumber,
    });

    if (!errorMessage) {
      return NextResponse.json({ message: 'Message sent!' }, { status: 200 });
    } else {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
