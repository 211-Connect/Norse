import { RequestHandler } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToBuffer from 'jwk-to-pem';
import client from '../lib/redis';
import { flatten, unflatten } from 'flat';
import { logger } from '../lib/winston';

export function authorizeMiddleware(): RequestHandler {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(401);
    }

    const certs = await client.hGetAll(
      `keycloak-realm-${req.tenant.keycloakRealmId}`
    );
    const unflattenedData: any = unflatten(certs);

    let response;
    if (Object.keys(unflattenedData).length === 0) {
      response = await axios.get(
        `${process.env.KEYCLOAK_URL}/realms/${req.tenant.keycloakRealmId}/protocol/openid-connect/certs`
      );

      if (
        !(response.data?.keys instanceof Array) ||
        (response.data?.keys instanceof Array &&
          response.data?.keys?.length === 0)
      ) {
        logger.info('No keys found in response from Keycloak');
        return res.sendStatus(401);
      } else {
        const flattened: any = flatten(response.data);

        const promises: Promise<any>[] = [];
        for (const prop in flattened) {
          if (flattened[prop] != null) {
            promises.push(
              client.hSet(
                `keycloak-realm-${req.tenant.keycloakRealmId}`,
                prop,
                flattened[prop]
              )
            );
          }
        }

        await Promise.all(promises);
      }
    } else {
      response = {
        data: unflattenedData,
      };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      return res.sendStatus(401);
    }

    const key = response.data.keys.find(
      (el: any) => el.kid === decoded?.header.kid
    );
    if (!key) return res.sendStatus(401);

    const pem = jwkToBuffer(key);
    if (!pem) return res.sendStatus(401);

    const verified = await verify(token, pem);
    if (!verified) return res.sendStatus(401);

    req.user = {
      id: verified.sub as string,
    };

    return next();
  };
}

async function verify(
  token: string,
  pem: jwt.Secret
): Promise<string | jwt.JwtPayload | null> {
  try {
    const verified = jwt.verify(token, pem);
    return verified;
  } catch (err) {
    return null;
  }
}
