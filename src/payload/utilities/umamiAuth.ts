let cachedToken: string | null = null;

async function isTokenValid(
  umamiApiUrl: string,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${umamiApiUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function login(umamiApiUrl: string): Promise<string> {
  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'UMAMI_USERNAME and UMAMI_PASSWORD environment variables are required.',
    );
  }

  const res = await fetch(`${umamiApiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Umami login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token?: string };

  if (!data.token) {
    throw new Error('Umami login response did not include a token.');
  }

  return data.token;
}

export async function getUmamiToken(umamiApiUrl: string): Promise<string> {
  if (cachedToken && (await isTokenValid(umamiApiUrl, cachedToken))) {
    return cachedToken;
  }

  cachedToken = await login(umamiApiUrl);
  return cachedToken;
}
