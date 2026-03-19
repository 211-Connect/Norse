export class FetchError extends Error {
  constructor(
    public response: {
      url: string;
      status: number;
      statusText: string;
      data?: any;
    },
  ) {
    super(
      `HTTP error! status: ${response.status} ${response.statusText} (${response.url})`,
    );
    this.name = 'FetchError';
  }
}
