import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload/payload-config';
import { cacheService } from '@/cacheService';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
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
  const healthCheck: HealthCheckResponse = {
    status: 'ok',
    timestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    services: {
      postgres: { status: 'ok' },
      redis: { status: 'ok' },
    },
  };

  try {
    const payload = await getPayload({ config });
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
