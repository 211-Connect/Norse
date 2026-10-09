interface Window {
  dataLayer: unknown[] | undefined;
  umami?: {
    track: (eventName: string, eventData?: Record<string, any>) => void;
  };
}
