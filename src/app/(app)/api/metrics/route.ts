import { NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ prefix: 'norse_' });

export async function GET(request: NextRequest) {
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
