interface Window {
  _mtm?: Array<Record<string, unknown>>;
  dataLayer: unknown[] | undefined;
  umami?: {
    track: (eventName: string, eventData?: Record<string, any>) => void;
  };
}
