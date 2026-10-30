import { redactUrl } from '@/lib/redact';

export class FetchError extends Error {
  constructor(
    public response: {
      url: string;
      status: number;
      statusText: string;
      data?: any;
    },
  ) {
    // The message ends up in logs: mask any secret passed in the query.
    super(
      `HTTP error! status: ${response.status} ${response.statusText} (${redactUrl(response.url)})`,
    );
    this.name = 'FetchError';
  }
}
