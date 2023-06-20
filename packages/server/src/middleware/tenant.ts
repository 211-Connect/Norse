import axios from 'axios';
import { RequestHandler } from 'express';
import qs from 'qs';
import { flatten, unflatten } from 'flat';
import client from '../lib/redis';
import { logger } from '../lib/winston';
import z from 'zod';

const populate = qs.stringify({
  populate: {
    facets: {
      populate: '*',
    },
    app_config: {
      populate: 'keycloakConfig',
    },
  },
});

const requiredQueryParams = z.object({
  tenant_id: z.string(),
});
export function tenantMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (process.env.MULTI_TENANT !== 'true') return next();
    const q = await requiredQueryParams.parseAsync(req.query);

    const tenantIdQuery = q.tenant_id;
    if (!tenantIdQuery) return res.sendStatus(400);

    try {
      const data = await client.hGetAll(tenantIdQuery);
      const unflattenedData: any = unflatten(data);

      if (Object.keys(unflattenedData).length > 0) {
        req.tenant = unflattenedData;
        return next();
      } else {
        const response = await axios.get(
          `${process.env.STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${tenantIdQuery}&${populate}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
            },
          }
        );

        const tenantData = response.data.data[0].attributes;
        tenantData.appConfig = tenantData.app_config.data.attributes;
        delete tenantData.app_config;

        const flattened: any = flatten(tenantData);

        const promises: Promise<any>[] = [];
        for (const prop in flattened) {
          if (flattened[prop] != null) {
            promises.push(client.hSet(tenantIdQuery, prop, flattened[prop]));
          }
        }

        await Promise.all(promises);

        if (!tenantData) return res.sendStatus(400);
        req.tenant = tenantData;

        return next();
      }
    } catch (err) {
      logger.error('Tenant middleware error:', err);
      return res.sendStatus(500);
    }
  };
}
