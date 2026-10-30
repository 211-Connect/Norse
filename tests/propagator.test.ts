import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  ROOT_CONTEXT,
  TraceFlags,
  context,
  trace,
  type TextMapGetter,
  type TextMapSetter,
} from '@opentelemetry/api';

import { InjectOnlyTraceContextPropagator } from '../src/instrumentation';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba90263';

const getter: TextMapGetter<Record<string, string>> = {
  get: (carrier, key) => carrier[key],
  keys: (carrier) => Object.keys(carrier),
};

const setter: TextMapSetter<Record<string, string>> = {
  set: (carrier, key, value) => {
    carrier[key] = value;
  },
};

describe('InjectOnlyTraceContextPropagator', () => {
  it('extract() returns the input context unchanged even with a valid traceparent', () => {
    const propagator = new InjectOnlyTraceContextPropagator();
    const carrier = {
      traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
    };
    const input = context.active();
    const output = propagator.extract(input, carrier, getter);
    assert.equal(output, input);
    // Nothing was extracted: no incoming span context is ever continued.
    assert.equal(trace.getSpanContext(output), undefined);
  });

  it('inject() writes traceparent for a sampled span context', () => {
    const propagator = new InjectOnlyTraceContextPropagator();
    const span = trace.wrapSpanContext({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
    });
    const carrier: Record<string, string> = {};
    propagator.inject(trace.setSpan(ROOT_CONTEXT, span), carrier, setter);
    assert.equal(carrier.traceparent, `00-${TRACE_ID}-${SPAN_ID}-01`);
  });

  it('inject() writes a `…-00` traceparent for an unsampled span context', () => {
    const propagator = new InjectOnlyTraceContextPropagator();
    const span = trace.wrapSpanContext({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      traceFlags: TraceFlags.NONE,
      isRemote: false,
    });
    const carrier: Record<string, string> = {};
    propagator.inject(trace.setSpan(ROOT_CONTEXT, span), carrier, setter);
    assert.equal(carrier.traceparent, `00-${TRACE_ID}-${SPAN_ID}-00`);
  });
});
