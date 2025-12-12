export const parseHost = (host: string): string => {
  return host.split('.localhost')[0];
};
