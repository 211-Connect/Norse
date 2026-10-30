/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config';
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views';
import type { Metadata } from 'next';

import { runsPayload } from '@/lib/norse-role';

import { importMap } from '../importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

// Local change to the generated file (keep it when Payload regenerates
// this): Payload's not-found page initializes Payload, which the public app
// (NORSE_ROLE=app) cannot. See docs/cms-app-separation-plan.md.
export const generateMetadata = async ({
  params,
  searchParams,
}: Args): Promise<Metadata> =>
  runsPayload()
    ? generatePageMetadata({ config, params, searchParams })
    : { title: 'Not Found' };

const NotFound = ({ params, searchParams }: Args) =>
  runsPayload()
    ? NotFoundPage({ config, params, searchParams, importMap })
    : 'Not Found';

export default NotFound;
