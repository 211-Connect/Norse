import arcjet, { shield, detectBot, tokenBucket } from '@arcjet/next';
import { isSpoofedBot } from '@arcjet/inspect';
import { NextRequest, NextResponse } from 'next/server';

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'DRY_RUN' }),
    detectBot({
      mode: 'DRY_RUN',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
    }),
    tokenBucket({
      mode: 'DRY_RUN',
      refillRate: 30,
      interval: 60,
      capacity: 40,
    }),
  ],
});

export async function protectWithArcjet(
  request: NextRequest,
): Promise<NextResponse | null> {
  // L0: No User-Agent check (Log only)
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua.trim()) {
    console.warn('[Anti-Bot] Empty User-Agent detected (L0 - WOULD BLOCK):', {
      ip: (request as any).ip,
      path: request.nextUrl.pathname,
    });
    // In LIVE mode, this would return 403
  }

  // L1-L4: Arcjet protection
  const decision = await aj.protect(request, { requested: 1 });

  // Log all "would block" decisions from Arcjet
  if (decision.results.some((result) => result.conclusion !== 'ALLOW')) {
    for (const result of decision.results) {
      if (result.conclusion !== 'ALLOW') {
        console.warn(
          `[Anti-Bot] Rule Triggered (${result.reason.type} - WOULD BLOCK):`,
          {
            reason: result.reason,
            ip: (request as any).ip,
            ua: ua,
            path: request.nextUrl.pathname,
          },
        );
      }
    }
  }

  // L4: Datacenter IP signal (Log only)
  if (decision.ip.isHosting()) {
    console.warn('[Anti-Bot] Hosting IP detected:', {
      ip: (request as any).ip,
      ua: ua,
      path: request.nextUrl.pathname,
    });
  }

  // L5: Spoofed Bot detection (Log only)
  if (decision.results.some(isSpoofedBot)) {
    console.warn('[Anti-Bot] Spoofed Bot detected (L5 - WOULD BLOCK):', {
      ip: (request as any).ip,
      ua: ua,
      path: request.nextUrl.pathname,
    });
  }

  return null;
}
