import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPostgres = global as unknown as { postgres: PrismaClient };

export const postgres = globalForPostgres.postgres || new PrismaClient();

if (process.env.NODE_ENV !== 'production')
  globalForPostgres.postgres = postgres;

export default postgres;
