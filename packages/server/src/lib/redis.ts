import { createClient } from 'redis';
import { logger } from './winston';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is not set');
}

const client = createClient({
  url: redisUrl,
  pingInterval: 4 * 60 * 1000, // 4 minutes
});

client.on('error', (err) => logger.error('Redis client error', err));
client.on('connect', () => logger.debug('Redis client is connected'));
client.on('reconnecting', () => logger.debug('Redis client is reconnecting'));
client.on('ready', () => logger.debug('Redis client is ready'));

export default client;
