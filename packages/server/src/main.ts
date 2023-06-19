import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';

import apiRoutes from './routes';
import redisClient from './lib/redis';
import { ensureLocale } from './middleware/ensureLocale';
import { connect as mongooseClient } from './lib/mongoose';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/winston';
import { rateLimiter } from './middleware/rateLimiter';

async function start() {
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const app = express();

  await redisClient.connect();
  await mongooseClient();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(ensureLocale('en'));
  app.use(rateLimiter());

  app.get('/__health', (req, res) => {
    res.sendStatus(200);
  });

  app.use('/', apiRoutes);
  app.use(errorHandler);

  app.listen(port, () => {
    logger.debug(`[ ready ] *:${port}`);
  });
}

start();
