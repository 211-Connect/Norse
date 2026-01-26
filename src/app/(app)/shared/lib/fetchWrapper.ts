import { FetchError } from './fetchError';

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: any; // Can accept any object, will be stringified automatically
}

export async function fetchWrapper<T = any>(
  url: string,
  options: FetchWrapperOptions = {},
): Promise<T | null> {
  const { parseResponse = true, body, ...fetchOptions } = options;

  try {
    const requestBody =
      body && typeof body === 'object' && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body;

    const response = await fetch(url, {
      ...fetchOptions,
      body: requestBody,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
    }

    if (!parseResponse) {
      return response as T;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (!(err instanceof FetchError)) {
      // Handle unexpected errors (network errors, JSON parsing errors, JSON.stringify errors, etc.)
      return null;
    }
    throw err;
  }
}
