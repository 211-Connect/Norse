import { FetchError } from './fetchError';

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: any; // Can accept any object, will be stringified automatically
}

export function sanitizePathSegment(segment: string): string {
  const trimmed = segment?.trim();
  // Allow only URL-safe identifier characters to prevent path traversal or header injection.
  const SAFE_SEGMENT_REGEX = /^[A-Za-z0-9_-]+$/;
  if (!trimmed || !SAFE_SEGMENT_REGEX.test(trimmed)) {
    throw new Error('Invalid identifier provided for URL path segment.');
  }
  return trimmed;
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
  const method = (fetchOptions.method ?? 'GET').toUpperCase();

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
        url,
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
