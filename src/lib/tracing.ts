import { type Context, SpanStatusCode, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

const tracer = trace.getTracer('norse-app');

/**
 * W3C trace context for outgoing calls only. Next.js extracts `traceparent`
 * from every incoming request, and nothing upstream of this app exports to
 * our Tempo, so an inbound header (a gateway's, a bot's) only makes the
 * request's root span the child of a span that never arrives. It would also
 * let any caller choose whether a request is sampled.
 */
export class InboundIgnoringTraceContextPropagator extends W3CTraceContextPropagator {
  extract(context: Context): Context {
    return context;
  }
}

/**
 * Runs background work in a new trace of its own, under a root span called
 * `name`, whatever context the caller happens to be in. For work a timer
 * fires: timers inherit the async context they were created in, so without
 * this it joins the request that armed the timer (see docs/tracing.md).
 */
export function inNewTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, { root: true }, async (span) => {
    try {
      return await fn();
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
