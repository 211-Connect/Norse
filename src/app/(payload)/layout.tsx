/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config';
import '@payloadcms/next/css';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import { notFound } from 'next/navigation';
import type { ServerFunctionClient } from 'payload';
import React from 'react';

import { runsPayload } from '@/lib/norse-role';

import { importMap } from './admin/importMap.js';
import './styles.css';

type Args = {
  children: React.ReactNode;
};

// Local change to the generated file (keep it when Payload regenerates
// this): the public app (NORSE_ROLE=app) has no database, so the admin and
// its server functions are a 404 there instead of a Payload init error. See
// docs/cms-app-separation-plan.md.
const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  if (!runsPayload()) notFound();
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => {
  if (!runsPayload()) notFound();

  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
};

export default Layout;
