import { createLogger } from '@/lib/logger';

const log = createLogger('getJwtExpirationTime');

export const isJwtExpired = (jwt: string): boolean | null => {
  try {
    const refreshTokenPayload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64').toString(),
    );

    if (
      refreshTokenPayload.exp &&
      Date.now() / 1000 >= refreshTokenPayload.exp
    ) {
      return true;
    }
  } catch (err) {
    log.error({ err }, 'Error parsing refresh token');
    return true;
  }

  return false;
};
