import { FetchError } from './fetchError';

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: any; // Can accept any object, will be stringified automatically
}

const toBody = (body: FetchWrapperOptions['body']) => {
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof FormData) {
    return body;
  }

  if (body && typeof body === 'object') {
    return JSON.stringify(body);
  }

  return body;
};

export async function fetchWrapper<T = any>(
  url: string,
  options: FetchWrapperOptions = {},
): Promise<T | null> {
  const { parseResponse = true, body, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body: toBody(body),
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
