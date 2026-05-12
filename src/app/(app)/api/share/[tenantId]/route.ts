import { NextResponse } from 'next/server';
import client from 'twilio';

import { createLogger } from '@/lib/logger';
import { findTenantById } from '@/payload/collections/Tenants/actions';

const log = createLogger('share');

const emsUrl = process.env.EMS_SERVICE_URL;
if (!emsUrl) {
  log.warn('EMS_SERVICE_URL is not configured. EMS provider will not work.');
}

interface SendSmsBody {
  phoneNumber: string;
  message: string;
}

async function sendViaTwilio(
  data: SendSmsBody,
  config: {
    accountSid: string;
    apiKey: string;
    apiKeySid: string;
    phoneNumber: string;
  },
) {
  const twilioClient = client(config.apiKeySid, config.apiKey, {
    accountSid: config.accountSid,
  });

  const result = await twilioClient.messages.create({
    body: data.message,
    from: config.phoneNumber,
    to: data.phoneNumber,
  });

  if (result.errorMessage) {
    throw new Error(result.errorMessage);
  }

  log.debug({ data }, 'Message sent via Twilio');

  return { success: true };
}

async function sendViaEMS(
  data: SendSmsBody,
  config: {
    apiKey: string;
    shortCode: string;
    keyword: string;
  },
) {
  if (!emsUrl) {
    throw new Error('EMS_SERVICE_URL is not configured');
  }

  const formData = new URLSearchParams();
  formData.append('api_key', config.apiKey);
  formData.append('api_v', '1');
  formData.append('phone_numbers', data.phoneNumber);
  formData.append('shortcode', config.shortCode);
  formData.append('keyword', config.keyword);
  formData.append('message', data.message);

  const response = await fetch(emsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(
      { status: response.status, body: errorText },
      'EMS API request failed',
    );
    throw new Error('Unable to send message via EMS');
  }

  const result = await response.json();

  if (result.fail && result.fail.length > 0) {
    throw new Error(`Failed to send to: ${result.fail.join(', ')}`);
  }

  if (
    result.success &&
    Array.isArray(result.success) &&
    result.success.length === 1
  ) {
    log.debug({ data }, 'Message sent via EMS');

    return { success: true };
  }

  log.error({ result }, 'Unexpected EMS API response format');

  throw new Error('Unknown EMS API response format');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId?: string }> },
) {
  const { tenantId } = await params;
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID is required in the URL' },
      { status: 400 },
    );
  }

  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const provider = tenant.sms?.smsProvider;

  try {
    const body: SendSmsBody = await request.json();

    if (!body.phoneNumber || typeof body.phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'phoneNumber is required and must be a string' },
        { status: 400 },
      );
    }

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'message is required and must be a string' },
        { status: 400 },
      );
    }

    if (provider === 'Twilio') {
      const { accountSid, apiKey, apiKeySid, phoneNumber } =
        tenant?.sms?.twilio ?? {};

      if (!accountSid || !apiKey || !apiKeySid || !phoneNumber) {
        log.error(
          { tenantId },
          'Twilio configuration is missing for tenant. Cannot send message.',
        );
        return NextResponse.json(
          { error: 'Twilio is not configured for this tenant' },
          { status: 500 },
        );
      }

      await sendViaTwilio(body, {
        accountSid,
        apiKey,
        apiKeySid,
        phoneNumber,
      });
    } else if (provider === 'EMS') {
      const { apiKey, shortCode, keyword } = tenant?.sms?.ems ?? {};

      if (!apiKey || !shortCode || !keyword) {
        log.error(
          { tenantId },
          'EMS configuration is missing for tenant. Cannot send message.',
        );
        return NextResponse.json(
          { error: 'EMS is not configured for this tenant' },
          { status: 500 },
        );
      }

      await sendViaEMS(body, {
        apiKey,
        shortCode,
        keyword,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "Twilio" or "EMS"' },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: 'Message sent!' }, { status: 200 });
  } catch (error) {
    log.error({ err: error, provider, tenantId }, 'Error in share route');
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
