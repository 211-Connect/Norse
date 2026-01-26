import { FetchError } from './fetchError';

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: any; // Can accept any object, will be stringified automatically
}

/**
 * A wrapper around fetch that handles errors consistently across the application.
 * Throws FetchError for HTTP errors and returns null for unexpected errors.
 * Automatically handles JSON.stringify for body objects.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with an additional parseResponse flag (defaults to true)
 * @returns The parsed JSON response or null on unexpected errors
 * @throws FetchError when the response is not ok
 */
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
    console.error('FetchWrapper error:', err);
    if (!(err instanceof FetchError)) {
      // Handle unexpected errors (network errors, JSON parsing errors, JSON.stringify errors, etc.)
      return null;
    }
    throw err;
  }
}
