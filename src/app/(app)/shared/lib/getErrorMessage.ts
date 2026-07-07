import { FetchError } from './fetchError';

export function getErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    const data = error.response?.data as
      | { error?: string; detail?: unknown; message?: unknown }
      | undefined;

    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    return `${error.response.status} ${error.response.statusText}`.trim();
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
