export const parseHost = (host: string): string => {
  return 'search.211illinois.org';
  return host.split('.localhost')[0];
};
