export class FetchError extends Error {
  constructor(
    public response: {
      status: number;
      statusText: string;
      data?: any;
    },
  ) {
    super(`HTTP error! status: ${response.status} ${response.statusText}`);
    this.name = 'FetchError';
  }
}
