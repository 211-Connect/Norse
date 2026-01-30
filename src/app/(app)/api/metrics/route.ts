import { NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ prefix: 'norse_' });

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.PROMETHEUS_TOKEN;

  if (
    !expectedToken ||
    !authHeader?.startsWith('Bearer ') ||
    authHeader.slice(7) !== expectedToken
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 },
    );
  }
}
