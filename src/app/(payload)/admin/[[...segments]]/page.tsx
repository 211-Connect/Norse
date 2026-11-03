/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
// this): the admin is a 404 in the public app (NORSE_ROLE=app), which has no
// database. See docs/cms-app-separation-plan.md.
export const generateMetadata = ({
  params,
  searchParams,
}: Args): Promise<Metadata> => {
  if (!runsPayload()) notFound();
  return generatePageMetadata({ config, params, searchParams });
};

const Page = ({ params, searchParams }: Args) => {
  if (!runsPayload()) notFound();
  return RootPage({ config, params, searchParams, importMap });
};

export default Page;
