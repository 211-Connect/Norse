import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { AppConfig } from '@/shared/context/app-config-context';

// According to the Next.js docs, API Routes are same-origin by default.
// Code follows https://github.com/vercel/next.js/blob/canary/examples/api-routes-cors/pages/api/cors.ts
const allowedMethods = ['GET', 'HEAD'];

const cors = Cors({
  methods: allowedMethods,
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function,
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

let appConfig: AppConfig | null = null;

const LogoHandler: NextApiHandler = async (req, res) => {
  if (!allowedMethods.includes(req.method || '')) {
    res.redirect('/404');

    return;
  }

  await runMiddleware(req, res, cors);

  if (!appConfig) {
    const { appConfig: newAppConfig } = await serverSideAppConfig();
    appConfig = newAppConfig;
  }

  const logoUrl = appConfig.brand?.logoUrl;
  if (!logoUrl) {
    res.redirect('/500');

    return;
  }

  res.redirect(logoUrl);
};

export default LogoHandler;
