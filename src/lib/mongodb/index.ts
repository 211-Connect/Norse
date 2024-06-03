import { PrismaClient } from '.prisma/mongodb';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForMongodb = global as unknown as { mongodb: PrismaClient };

export const mongodb = globalForMongodb.mongodb || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForMongodb.mongodb = mongodb;

export default mongodb;
