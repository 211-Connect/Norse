import { NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { cacheService } from '@/cacheService';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  memory?: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    heapUsedPercent: number;
    external: string;
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

  // Collect memory usage statistics
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
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapUsedPercent,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
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
        healthCheck.status = 'degraded';
        healthCheck.services.redis.status = 'error';
        healthCheck.services.redis.message = 'Cache verification failed';
      }
    }
  } catch (error) {
    healthCheck.status = 'degraded';
    healthCheck.services.redis.status = 'error';
    healthCheck.services.redis.message =
      error instanceof Error ? error.message : 'Redis connection failed';
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}
