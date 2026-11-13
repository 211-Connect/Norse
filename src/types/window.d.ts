interface Window {
  dataLayer: unknown[] | undefined;
  umami?: {
    track: {
      (eventName: string, eventData?: Record<string, any>): void;
      (payload: Record<string, unknown>): void;
    };
    identify: (distinctId: string) => Promise<void>;
  };
  norseUmamiBeforeSend?: (
    type: string,
    payload: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | undefined>;
}
