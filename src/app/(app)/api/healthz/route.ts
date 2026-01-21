import { NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { cacheService } from '@/cacheService';

export const dynamic = 'force-dynamic';
type MB = number;

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  memory?: {
    rss: MB;
    heapTotal: MB;
    heapUsed: MB;
    external: MB;
    arrayBuffers?: MB;
    heapUsedPercent: number;
  };
  services: {
    postgres: {
      status: 'ok' | 'error';
      message?: string;
    };
    redis: {
      status: 'ok' | 'error' | 'disabled';
      message?: string;
    };
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();

  const memUsage = process.memoryUsage();
  const heapUsedPercent = Math.round(
    (memUsage.heapUsed / memUsage.heapTotal) * 100,
  );

  const healthCheck: HealthCheckResponse = {
    status: 'ok',
    timestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
      heapUsedPercent,
    },
    services: {
      postgres: { status: 'ok' },
      redis: { status: 'ok' },
    },
  };

  if (heapUsedPercent > 80) {
    console.warn('High memory usage detected:', healthCheck.memory);
    healthCheck.status = 'degraded';
  }

  try {
    const payload = await getPayloadSingleton();
    await payload.find({
      collection: 'users',
      limit: 1,
      pagination: false,
    });
    healthCheck.services.postgres.status = 'ok';
  } catch (error) {
    healthCheck.status = 'degraded';
    healthCheck.services.postgres.status = 'error';
    healthCheck.services.postgres.message =
      error instanceof Error ? error.message : 'Database connection failed';
  }

  try {
    if (!process.env.CACHE_REDIS_URI) {
      healthCheck.services.redis.status = 'disabled';
      healthCheck.services.redis.message = 'CACHE_REDIS_URI not configured';
    } else {
      const ok = await cacheService.isHealthy();

      if (ok) {
        healthCheck.services.redis.status = 'ok';
      } else {
        healthCheck.services.redis.status = 'error';
        healthCheck.services.redis.message = 'Cache verification failed';
      }
    }
  } catch (error) {
    healthCheck.services.redis.status = 'error';
    healthCheck.services.redis.message =
      error instanceof Error ? error.message : 'Redis connection failed';
  }

  return NextResponse.json(healthCheck, { status: 200 });
}
