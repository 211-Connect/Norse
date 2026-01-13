export async function fetchApi(
  path: string,
  options: {
    tenantId?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string | undefined>;
    headers?: HeadersInit;
  } = {},
) {
  const { tenantId, method = 'GET', body, params, headers = {} } = options;

  const urlObj = new URL(
    path,
    path.startsWith('http') ? undefined : 'http://localhost',
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlObj.searchParams.set(key, value);
      }
    });
  }

  if (tenantId) {
    urlObj.searchParams.set('tenant_id', tenantId);
  }

  const finalHeaders: HeadersInit = {
    ...headers,
  };

  if (tenantId) {
    finalHeaders['x-tenant-id'] = tenantId;
  }

  if (body && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(urlObj.toString(), {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as any).response = {
      status: response.status,
      data: await response.json().catch(() => ({})),
    };
    throw error;
  }

  const data = await response.json();
  return { data };
}
