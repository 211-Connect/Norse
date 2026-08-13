import { createLogger } from '@/lib/logger';

const log = createLogger('getJwtSub');

export function getJwtSub(jwt?: string | null): string | undefined {
  if (!jwt) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64').toString(),
    );
    return typeof payload?.sub === 'string' ? payload.sub : undefined;
  } catch (err) {
    log.error({ err }, 'Error decoding access token payload');
    return undefined;
  }
}
