import { hostname } from 'node:os';

/**
 * Which container served a request. On the DigitalOcean App Platform each
 * instance is one container with its own hostname; `HOSTNAME` in the
 * environment is `0.0.0.0` (the listen address), so the OS value is the
 * only usable identity. Carried on the OTel resource (`host.name`) and on
 * the Arcjet failure logs, so a trace and a log line can be tied to one
 * instance's CPU and memory in the DigitalOcean console (ISS-1739).
 *
 * Node only: never import from code that can run on the Edge runtime.
 */
export const INSTANCE_ID = hostname();
