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
    console.error('Error parsing refresh token:', err);
    return true;
  }

  return false;
};
