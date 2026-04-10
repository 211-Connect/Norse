import { NextRequest, NextResponse } from 'next/server';
import { API_URL, INTERNAL_API_KEY } from '@/app/(app)/shared/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array' },
      { status: 400 },
    );
  }

  if (!ids.every((id) => typeof id === 'string')) {
    return NextResponse.json(
      { error: 'ids must be an array of strings' },
      { status: 400 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { error: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  const upstream = await fetch(`${API_URL}/resource/titles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': INTERNAL_API_KEY ?? '',
      'x-tenant-id': body?.tenantId ?? '',
      'x-api-version': '1',
    },
    body: JSON.stringify({ ids }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { error: `Upstream error ${upstream.status}: ${text}` },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
