import { findByHost } from '@/payload/collections/Tenants/services/findByHost';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');
  const secret = searchParams.get('secret');

  if (secret !== process.env.PAYLOAD_API_ROUTE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!host) {
    return new Response('Host query parameter is required', { status: 400 });
  }

  const tenant = await findByHost(host);

  if (!tenant) {
    return new Response('Tenant not found', { status: 404 });
  }

  return new Response(JSON.stringify(tenant), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
