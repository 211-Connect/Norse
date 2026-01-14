export const parseHost = (host: string): string => {
  // Remove port number if present (e.g., localhost:3000 -> localhost)
  const hostWithoutPort = host.split(':')[0];
  // Extract subdomain if using .localhost pattern (e.g., subdomain.localhost -> subdomain)
  return hostWithoutPort.split('.localhost')[0];
};
