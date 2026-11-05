/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import '@payloadcms/next/css';
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes';

import { cmsOnly } from '@/lib/cms/internal-route';
import config from '@/payload/payload-config';

// Local change to the generated file (keep it when Payload regenerates
// this): `cmsOnly` answers 404 in the public app (NORSE_ROLE=app), which has
// no database. See docs/cms-app-separation-plan.md.
export const GET = cmsOnly(REST_GET(config));
export const POST = cmsOnly(REST_POST(config));
export const DELETE = cmsOnly(REST_DELETE(config));
export const PATCH = cmsOnly(REST_PATCH(config));
export const PUT = cmsOnly(REST_PUT(config));
export const OPTIONS = cmsOnly(REST_OPTIONS(config));
