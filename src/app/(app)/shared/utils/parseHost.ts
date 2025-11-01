export const parseHost = (host: string): string => {
  return process.env.NODE_ENV === 'development'
    ? host.split('.localhost')[0]
    : host;
};
